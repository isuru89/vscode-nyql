package org.isuru.nyql.utils;

import com.virtusa.gto.nyql.configs.Configurations;
import com.virtusa.gto.nyql.configs.NyConfig;
import com.virtusa.gto.nyql.engine.NyQLInstance;
import com.virtusa.gto.nyql.engine.impl.NyQLResult;
import com.virtusa.gto.nyql.exceptions.NyException;
import com.virtusa.gto.nyql.model.QScript;
import com.virtusa.gto.nyql.model.QScriptList;
import com.virtusa.gto.nyql.model.QScriptResult;
import fi.iki.elonen.NanoHTTPD;
import groovy.json.JsonOutput;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * @author iweerarathna
 */
public class Server extends NanoHTTPD {

    private static final Logger LOGGER = Logger.getLogger(Server.class.getName());

    private static final String CONTENT_TYPE_CSS = "text/css";
    private static final String CONTENT_TYPE_JS = "application/javascript";

    private final JSONParser parser = new JSONParser();
    private static final String APP_JSON = "application/json";

    private static final Map<String, NyQLInstance> NY_POOL = new HashMap<String, NyQLInstance>();

    private static final List<File> dirs = new ArrayList<>();

    public Server(int port) {
        super(port);
    }

    public static void main(String[] args) throws Exception {
        start(args);
    }

    @SuppressWarnings("unchecked")
    private static void start(String[] args) throws Exception {
        Map<String, String> map = NHelper.argParser(args);
        String port = map.get("p");
        System.out.println("Starting with port: " + port);
        int p = Integer.parseInt(port);

        String serveDirs = map.get("f");
        if (serveDirs != null) {
            String[] ddirs = serveDirs.split("[,]");
            for (String d : ddirs) {
                System.out.println("Adding dir: " + d);
                dirs.add(new File(d));
            }
        }
        System.out.println(new File(".").getCanonicalPath());
        File file = new File("../node_modules/ace-builds/src-noconflict");
        if (file.exists()) {
            dirs.add(file.getCanonicalFile());
        }

        final Server s = new Server(p);
        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            @Override
            public void run() {
                s.shutdownAllNyQL();
                if (s.isAlive()) {
                    s.stop();
                }
            }
        }));
        s.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
        System.out.println("Server OK");
        System.out.flush();
    }

    @Override
    public Response serve(IHTTPSession session) {
        if (session.getUri().length() > 1) {
            return serveStatics(session);
        }

        Map<String, String> body = new HashMap<>();
        try {
            session.parseBody(body);
            String postData = body.get("postData");
            JSONObject input = (JSONObject) parser.parse(postData);
            String response = invoke(input);
            return newFixedLengthResponse(Response.Status.OK, APP_JSON, response);

        } catch (IOException e) {
            return newFixedLengthResponse(Response.Status.BAD_REQUEST, APP_JSON, e.getMessage());
        } catch (ResponseException e) {
            return newFixedLengthResponse(e.getStatus(), APP_JSON, e.getMessage());
        } catch (ParseException e) {
            return newFixedLengthResponse(Response.Status.BAD_REQUEST, APP_JSON, e.getMessage());
        } catch (NyException e) {
            return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, APP_JSON, e.getMessage());
        }
    }

    private Response serveStatics(IHTTPSession session) {
        String path = session.getUri();
        String contentType;
        if (path.endsWith("css")) {
            contentType = CONTENT_TYPE_CSS;
        } else {
            contentType = CONTENT_TYPE_JS;
        }
        FileInputStream fis;
        File file = null;
        try {
            for (int i = 0; i < dirs.size(); i++) {
                File tmp = new File(dirs.get(i), path);
                if (tmp.exists()) {
                    file = tmp;
                    break;
                }
            }
            fis = new FileInputStream(file);
            return newFixedLengthResponse(Response.Status.OK, contentType, fis, file.length());
        } catch (FileNotFoundException e) {
            return newFixedLengthResponse(Response.Status.NOT_FOUND, contentType, null);
        }
    }

    private NyQLInstance createInst(Map<String, String> data) throws IOException {
        String scriptDir = data.get("scriptDir");
        if (scriptDir == null || !new File(scriptDir).exists()) {
            throw new IOException("No scripts dir provided or it does not exist!");
        }

        String name = data.get("name");
        removeNyQL(name);

        String dbHost = data.get("host");
        String dbPort = String.valueOf(data.get("port"));
        String username = data.get("username");
        String password = Base64.getEncoder().encodeToString(data.get("password").getBytes());
        String dbName = data.get("databaseName");
        String dialect = data.get("dialect").toLowerCase();

        String url = buildUrl(dialect, dbHost, dbPort, dbName);
        LOGGER.info("Creating nyql instance: " + url);
        try {
            Configurations build = NyConfig.withV2Defaults()
                    .havingName(name)
                    .forDatabase(dialect)
                    .scriptFolder(new File(scriptDir))
                    .jdbcOptions(url, username, password)
                    .withCaching(false, false, true)
                    .build();
            NyQLInstance nyQLInstance = NyQLInstance.create(build);
            NY_POOL.put(name, nyQLInstance);
            return nyQLInstance;
        } catch (NyException ex) {
            ex.printStackTrace();
            throw new IOException("Failed to initialize nyql instance!", ex);
        }
    }

    private static String buildUrl(String type, String dbHost, String dbPort, String dbName) {
        StringBuilder url = new StringBuilder();
        url.append("jdbc:")
                .append(type.toLowerCase())
                .append("://")
                .append(dbHost);
        if (dbPort != null && !dbPort.isEmpty()) {
            url.append(":").append(dbPort);
        }
        url.append("/").append(dbName);
        return url.toString();
    }

    private String invoke(Map<String, String> input) throws IOException, ParseException, NyException {
        String cmd = input.get("cmd");
        if (cmd.equalsIgnoreCase("deps")) {
            return JsonOutput.toJson(Deps.process(input));
        } else if (cmd.equalsIgnoreCase("refs")) {
            return JsonOutput.toJson(Refs.process(input));
        } else if (cmd.equalsIgnoreCase("convert")) {
            return JsonOutput.toJson(Converter.process(input));
        } else if (cmd.equalsIgnoreCase("replacer")) {
            return JsonOutput.toJson(ParamReplacer.process(input));
        } else if (cmd.equalsIgnoreCase("con")) {
            createInst(input);
        } else if (cmd.equalsIgnoreCase("exit")) {
            shutdownAllNyQL();
            stop();
        } else if (cmd.equalsIgnoreCase("ping")) {
            Map<String, String> pong = new HashMap<>();
            pong.put("msg", "pong");
            return JsonOutput.toJson(pong);
        } else if (cmd.equalsIgnoreCase("remove")) {
            String name = input.get("name");
            removeNyQL(name);
        } else if (cmd.equalsIgnoreCase("parse")) {
            String name = input.get("name");
            NyQLInstance nyQLInstance = NY_POOL.get(name);
            if (nyQLInstance != null) {
                String path = input.get("path");
                String data = input.get("data");
                QScript parse = nyQLInstance.parse(path, fromStr(data));
                Map<String, Object> result = new HashMap<>();
                if (parse instanceof QScriptList) {
                    QScriptList scriptList = (QScriptList) parse;
                    result.put("type", scriptList.getType());
                } else if (parse instanceof QScriptResult) {
                    result.put("type", "SCRIPT");
                    result.put("query", "");
                } else {
                    result.put("type", parse.getProxy().getQueryType());
                    result.put("query", parse.getProxy().getQuery());
                    result.put("params", NHelper.toJson(parse.getProxy().getOrderedParameters()));
                    return JsonOutput.toJson(result);
                }
            }
            NY_POOL.remove(name);
        } else if (cmd.equalsIgnoreCase("execute")) {
            String name = input.get("name");
            NyQLInstance nyQLInstance = NY_POOL.get(name);
            if (nyQLInstance != null) {
                String path = input.get("path");
                Object data = input.get("data");
                Object result = nyQLInstance.execute(path, fromStr(data));
                Map<String, Object> map = new HashMap<>();
                if (result instanceof NyQLResult) {
                    NyQLResult nyQLResult = (NyQLResult)result;
                    map.put("columns", nyQLResult.fetchedColumns());
                } else {
                    map.put("columns", Collections.singletonList("result_column"));
                }
                map.put("result", result);
                return JsonOutput.toJson(map);
            }
        }
        return "{}";
    }

    private synchronized void removeNyQL(String name) {
        if (NY_POOL.containsKey(name)) {
            NyQLInstance nyQLInstance = NY_POOL.get(name);
            LOGGER.info("Shutting down nyql instance: " + nyQLInstance.getName());
            nyQLInstance.shutdown();
            NY_POOL.remove(name);
        }
    }

    private Map<String, Object> fromStr(Object dataInput) throws ParseException {
        Map<String, Object> map = new HashMap<>();

        if (dataInput instanceof JSONObject) {
            JSONObject data = (JSONObject) dataInput;
            if (!data.isEmpty()) {
                for (Object o : data.keySet()) {
                    map.put(o.toString(), data.get(o));
                }
            }
        }
        return map;
    }

    private Map<String, Object> fromStr(String data) throws ParseException {
        Map<String, Object> map = new HashMap<>();
        if (data != null && !data.isEmpty()) {
            JSONObject parse = (JSONObject) parser.parse(data);
            for (Object o : parse.keySet()) {
                map.put(o.toString(), parse.get(o));
            }
        }
        return map;
    }

    private void shutdownAllNyQL() {
        for (NyQLInstance nyQLInstance : NY_POOL.values()) {
            LOGGER.info("Shutting down nyql: " + nyQLInstance.getName());
            nyQLInstance.shutdown();
        }
        NY_POOL.clear();
    }

}
