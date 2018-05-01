package org.isuru.nyql.utils;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author iweerarathna
 */
class Refs {

    @SuppressWarnings("unchecked")
    static Object process(Map<String, String> input) throws IOException {
        input.put("locations", "true");
        Map<String, List<Deps.Location>> process = (Map<String, List<Deps.Location>>) Deps.process(input);
        if (process == null) {
            return new HashMap<>();
        }

        String file = input.get("file");
        File root = new File(input.get("root")).getCanonicalFile();
        if (file == null || !new File(file).exists()) {
            throw new IOException("The given file does not exist!");
        }
        String path = root.toPath().relativize(new File(file).toPath()).toString();
        if (path.toLowerCase().endsWith(".groovy") || path.toLowerCase().endsWith(".nyql")) {
            int pos = path.lastIndexOf('.');
            path = path.substring(0, pos);
        }
        List<Deps.Location> callers = new ArrayList<>();
        for (Map.Entry<String, List<Deps.Location>> entry : process.entrySet()) {
            for (Deps.Location l : entry.getValue()) {
                if (l.getCall().equals(path)) {
                    callers.add(new Deps.Location(entry.getKey(), l.getLine(), l.getOffset()));
                    break;
                }
            }
        }
        return callers;
    }

}
