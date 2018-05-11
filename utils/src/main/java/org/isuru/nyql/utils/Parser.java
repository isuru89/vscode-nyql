package org.isuru.nyql.utils;

import com.virtusa.gto.nyql.configs.Configurations;
import com.virtusa.gto.nyql.configs.NyConfig;
import com.virtusa.gto.nyql.engine.NyQLInstance;
import com.virtusa.gto.nyql.exceptions.NyException;
import com.virtusa.gto.nyql.model.units.ParamList;
import org.codehaus.groovy.ast.ASTNode;
import org.codehaus.groovy.ast.ClassNode;
import org.codehaus.groovy.ast.CodeVisitorSupport;
import org.codehaus.groovy.ast.builder.AstBuilder;
import org.codehaus.groovy.ast.expr.ArgumentListExpression;
import org.codehaus.groovy.ast.expr.ConstantExpression;
import org.codehaus.groovy.ast.expr.DeclarationExpression;
import org.codehaus.groovy.ast.expr.Expression;
import org.codehaus.groovy.ast.expr.MethodCallExpression;
import org.codehaus.groovy.ast.expr.PropertyExpression;
import org.codehaus.groovy.ast.expr.VariableExpression;
import org.codehaus.groovy.control.CompilePhase;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * @author iweerarathna
 */
class Parser {

    private static class Domain {
        private int count = 0;
        private int limit = Integer.MAX_VALUE;
        private File root;
        private Map<String, ScriptInfo> scriptInfoMap = new HashMap<>();
    }

    static class ScriptInfo {
        private boolean sessionUsed = false;
        private List<String> dslCalls;
        private Set<String> scriptCalls;
        private boolean cached = false;
        private Set<String> usedSessionVars;
        private List<Map<String, String>> params;

        public List<Map<String, String>> getParams() {
            return params;
        }

        public void setParams(List<Map<String, String>> params) {
            this.params = params;
        }

        public boolean isSessionUsed() {
            return sessionUsed;
        }

        public void setSessionUsed(boolean sessionUsed) {
            this.sessionUsed = sessionUsed;
        }

        public List<String> getDslCalls() {
            return dslCalls;
        }

        public void setDslCalls(List<String> dslCalls) {
            this.dslCalls = dslCalls;
        }

        public Set<String> getScriptCalls() {
            return scriptCalls;
        }

        public void setScriptCalls(Set<String> scriptCalls) {
            this.scriptCalls = scriptCalls;
        }

        public boolean isCached() {
            return cached;
        }

        public void setCached(boolean cached) {
            this.cached = cached;
        }

        public Set<String> getUsedSessionVars() {
            return usedSessionVars;
        }

        public void setUsedSessionVars(Set<String> usedSessionVars) {
            this.usedSessionVars = usedSessionVars;
        }
    }

    static boolean canParsable(ScriptInfo scriptInfo) {
        if (scriptInfo.sessionUsed) {
            return false;
        }
        return !scriptInfo.dslCalls.contains("script")
                && !scriptInfo.dslCalls.contains("RUN");
    }

    public static void main(String[] args) throws IOException {
        //File root = new File("/Users/iweerarathna/projects/insight/database/scripts");
        File root = new File("/Users/iweerarathna/projects/insight/database/scripts/support/supportGetSubmissionsForFeed.groovy");
        //count = 0;
        Domain domain = new Domain();
        domain.root = root;
        scan(root, domain);

    }

    static ScriptInfo parse(Map<String, String> input) {
        File root = new File(input.get("root"));
        File file = new File(input.get("file"));

        Domain domain = new Domain();
        domain.root = root;
        scan(file, domain);

        Map.Entry<String, ScriptInfo> next = domain.scriptInfoMap.entrySet().iterator().next();
        ScriptInfo scriptInfo = next.getValue();
        Set<String> variables = new HashSet<>();
        List<Map<String, String>> params = new ArrayList<>();
        Set<String> alreadyVisited = new HashSet<>();
        alreadyVisited.add(file.getAbsolutePath());
        findVarsRecursively(scriptInfo, variables, params, alreadyVisited, s -> new File(root, s));
        scriptInfo.usedSessionVars.addAll(variables);
        scriptInfo.params.addAll(params);
        return scriptInfo;
    }

    private static void findVarsRecursively(ScriptInfo scriptInfo, Set<String> vars,
                                            List<Map<String, String>> params,
                                            Set<String> alreadyVisited,
                                            Function<String, File> scriptResolver) {
        if (scriptInfo.scriptCalls.isEmpty()) {
            return;
        }

        for (String script : scriptInfo.scriptCalls) {
            File grFile = scriptResolver.apply(script + ".groovy");
            if (!grFile.exists()) {
                grFile = scriptResolver.apply(script + ".nyql");
                if (!grFile.exists()) {
                    System.out.println("File does not exist! " + grFile.getAbsolutePath());
                    break;
                }
            }

            System.out.println("Scanning file: " + grFile.getAbsolutePath());

            String content = NHelper.toContentStr(grFile);
            ParseVisitor visitor = visit(content);
            vars.addAll(visitor.sessionVars);
            params.addAll(visitor.params);
            alreadyVisited.add(grFile.getAbsolutePath());

            if (!visitor.scriptCalls.isEmpty()) {
                findVarsRecursively(getVisitorInfo(visitor), vars, params, alreadyVisited, scriptResolver);
            }
        }
    }

    private static ParseVisitor visit(String content) {
        ParseVisitor visitor = new ParseVisitor();
        List<ASTNode> astNodes = new AstBuilder().buildFromString(CompilePhase.CONVERSION, false, content);
        for (ASTNode node : astNodes) {
            if (!(node instanceof ClassNode)) {
                node.visit(visitor);
            }
        }
        return visitor;
    }

    static void scan(File dirOrFile, Domain domain) {
        if (dirOrFile.isDirectory()) {
            File[] files = dirOrFile.listFiles();
            if (files != null) {
                for (File file : files) {
                    scan(file, domain);
                }
            }

        } else {
            if (domain.count > domain.limit) {
                return;
            }
            domain.count++;
            String fname = dirOrFile.getName().toLowerCase();
            if (fname.endsWith(".groovy") || fname.endsWith(".nyql")) {
                String content = NHelper.toContentStr(dirOrFile);
                System.out.println("Scanning: " + dirOrFile.getAbsolutePath());
                ParseVisitor visitor = visit(content);

                String path = domain.root.toPath().relativize(dirOrFile.toPath()).toString();
                domain.scriptInfoMap.put(path, getVisitorInfo(visitor));
            }
        }
    }

    private static ScriptInfo getVisitorInfo(ParseVisitor visitor) {
//        System.out.println(" - SESSION used   : " + visitor.sessionUsed);
//        System.out.println(" - Cached         : " + visitor.cached);
//        System.out.println(" - Scripts called : " + visitor.scriptCalls);
//        System.out.println(" - Dsl Calls      : " + visitor.dslCalls);
//        System.out.println(" - Params alls    : " + visitor.params);

        ScriptInfo scriptInfo = new ScriptInfo();
        scriptInfo.cached = visitor.cached;
        scriptInfo.sessionUsed = visitor.sessionUsed;
        scriptInfo.dslCalls = visitor.dslCalls;
        scriptInfo.scriptCalls = visitor.scriptCalls;
        scriptInfo.usedSessionVars = visitor.sessionVars;
        scriptInfo.params = visitor.params;
        return scriptInfo;
    }

    private static void run() throws IOException {
        Parser test = new Parser();

        Map<String, String> data = new HashMap<>();
        data.put("name", "isuru");
        data.put("scriptDir", "/Users/iweerarathna/projects/insight/database/scripts");
        data.put("host", "localhost");
        data.put("port", "3306");
        data.put("username", "root");
        data.put("password", "root");
        data.put("databaseName", "bpmn");
        data.put("dialect", "mysql");

        NyQLInstance nyQLInstance = test.createInst(data);

        nyQLInstance.shutdown();
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

    private NyQLInstance createInst(Map<String, String> data) throws IOException {
        String scriptDir = data.get("scriptDir");
        if (scriptDir == null || !new File(scriptDir).exists()) {
            throw new IOException("No scripts dir provided or it does not exist!");
        }

        String name = data.get("name");

        String dbHost = data.get("host");
        String dbPort = String.valueOf(data.get("port"));
        String username = data.get("username");
        String password = Base64.getEncoder().encodeToString(data.get("password").getBytes());
        String dbName = data.get("databaseName");
        String dialect = data.get("dialect").toLowerCase();

        String url = buildUrl(dialect, dbHost, dbPort, dbName);
        System.out.println("Creating nyql instance: " + url);
        try {
            Configurations build = NyConfig.withV2Defaults()
                    .havingName(name)
                    .forDatabase(dialect)
                    .scriptFolder(new File(scriptDir))
                    .jdbcOptions(url, username, password)
                    .withCaching(true, false, true, true)
                    .build();
            return NyQLInstance.create(build);
        } catch (NyException ex) {
            ex.printStackTrace();
            throw new IOException("Failed to initialize nyql instance!", ex);
        }
    }

    private static class ParseVisitor extends CodeVisitorSupport {

        private static final String EMPTY = "";
        private boolean sessionUsed = false;
        private Set<String> sessionVars = new HashSet<>();
        private List<String> dslCalls = new ArrayList<>();
        private Set<String> scriptCalls = new HashSet<>();
        private List<Map<String, String>> params = new ArrayList<>();
        private boolean insideScriptCall = false;
        private boolean cached = false;

        @Override
        public void visitDeclarationExpression(DeclarationExpression expression) {
            super.visitDeclarationExpression(expression);
            if (!cached) {
                cached = expression.getVariableExpression().getName().equals("do_cache")
                        && expression.getAnnotations().size() > 0;
            }
        }

        @Override
        public void visitConstantExpression(ConstantExpression expression) {
            if (insideScriptCall) {
                scriptCalls.add(expression.getText());
            }
            super.visitConstantExpression(expression);
        }

        @Override
        public void visitPropertyExpression(PropertyExpression expression) {
            if (isSessionVar(expression.getObjectExpression())) {
                sessionVars.add(expression.getPropertyAsString());
            } else {
                String parents = derivePropertyChain(expression.getObjectExpression());
                if (parents.startsWith("$SESSION.")) {
                    String suffix = parents.substring("$SESSION.".length());
                    sessionVars.add(suffix + "." + expression.getPropertyAsString());
                }
            }
            super.visitPropertyExpression(expression);
        }

        private String derivePropertyChain(Expression expression) {
            if (expression instanceof PropertyExpression) {
                return derivePropertyChain(((PropertyExpression) expression).getObjectExpression()) + "." +
                    ((PropertyExpression) expression).getPropertyAsString();
            } else if (isSessionVar(expression)) {
                return expression.getText();
            }
            return EMPTY;
        }

        @Override
        public void visitVariableExpression(VariableExpression expression) {
            if (!sessionUsed && isSessionVar(expression)) {
                sessionUsed = true;
            }
            super.visitVariableExpression(expression);
        }

        @Override
        public void visitMethodCallExpression(MethodCallExpression call) {
            if (isDsl(call.getObjectExpression())) {
                dslCalls.add(call.getMethodAsString());
            }

            if (call.getMethodAsString().equals("$IMPORT")
                    || call.getMethodAsString().equals("RUN")
                    || call.getMethodAsString().equals("$IMPORT_SAFE")) {
                call.getObjectExpression().visit(this);
                call.getMethod().visit(this);
                insideScriptCall = isFirstArgConstant(call.getArguments());
                call.getArguments().visit(this);
                insideScriptCall = false;
            } else if (isParam(call.getMethodAsString())) {
                Map<String, String> p = new HashMap<>();
                p.put("name", getFirstArgConstant(call.getArguments()));
                if (call.getMethodAsString().equals("PARAMLIST") || call.getMethodAsString().equals("PARAM_LIST")) {
                    p.put("type", ParamList.class.getSimpleName());
                } else {
                    p.put("type", "AParam");
                }
                params.add(p);
            } else {
                super.visitMethodCallExpression(call);
            }
        }

        private boolean isParam(String method) {
            return method.equals("PARAM")
                    || method.equals("PARAMLIST")
                    || method.equals("PARAM_LIST")
                    || method.equals("PARAM_DATE")
                    || method.equals("PARAM_TIMESTAMP")
                    || method.equals("PARAM_BINARY");
        }

        private boolean isDsl(Expression expression) {
            if (expression instanceof VariableExpression) {
                return ((VariableExpression) expression).getName().equals("$DSL");
            }
            return false;
        }

        private boolean isFirstArgConstant(Expression expression) {
            if (expression instanceof ArgumentListExpression) {
                ArgumentListExpression ale = (ArgumentListExpression)expression;
                if (ale.getExpressions().size() > 0) {
                    return ale.getExpression(0) instanceof ConstantExpression;
                }
            }
            return false;
        }

        private String getFirstArgConstant(Expression expression) {
            if (expression instanceof ArgumentListExpression) {
                ArgumentListExpression ale = (ArgumentListExpression)expression;
                if (ale.getExpressions().size() > 0 && ale.getExpression(0) instanceof ConstantExpression) {
                    return ((ConstantExpression) ale.getExpression(0)).getText();
                }
            }
            return null;
        }

        private boolean isSessionVar(Expression expression) {
            if (expression instanceof VariableExpression) {
                return ((VariableExpression) expression).getName().equals("$SESSION");
            }
            return false;
        }
    }

}
