package org.isuru.nyql.utils;

import com.virtusa.gto.nyql.model.units.AParam;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author iweerarathna
 */
class NHelper {

    private static Map<String, String> toJson(AParam param) {
        Map<String, String> p = new HashMap<>();
        p.put("name", param.get__name());
        p.put("type", param.getClass().getSimpleName());
        return p;
    }

    static List<Map<String, String>> toJson(Collection<AParam> param) {
        List<Map<String, String>> list = new ArrayList<>();
        if (param != null) {
            for (AParam p : param) {
                list.add(toJson(p));
            }
        }
        return list;
    }

    static Map<String, String> argParser(String[] args) {
        Map<String, String> map = new LinkedHashMap<String, String>();
        if (args == null || args.length == 0) {
            return map;
        }

        int cur = 0;
        int N = args.length;
        while (cur < N) {
            String p = args[cur++];
            if (p.startsWith("-")) {
                String key = p.substring(1);
                if (cur < N) {
                    String val = args[cur++];
                    map.put(key, val);
                } else {
                    map.put(key, "");
                }
            }
        }
        return map;
    }

    static void writeToFile(String content, File destination) {
        BufferedWriter writer = null;

        try {
            writer = new BufferedWriter(new FileWriter(destination));
            writer.write(content);
            writer.flush();
        } catch (IOException ex) {
            System.err.println(ex.getMessage());
        } finally {
            if (writer != null) {
                try {
                    writer.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    static String toContentStr(File src) {
        StringBuilder sb = new StringBuilder();
        String lineSeparator = System.getProperty("line.separator");
        BufferedReader reader = null;

        try {
            reader = new BufferedReader(new FileReader(src));
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append(lineSeparator);
            }
            return sb.toString();
        } catch (IOException ex) {
            System.err.println(ex.getMessage());
            return sb.toString();
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

}
