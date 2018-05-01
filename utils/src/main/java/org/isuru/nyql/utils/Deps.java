package org.isuru.nyql.utils;

import org.codehaus.groovy.ast.ASTNode;
import org.codehaus.groovy.ast.ClassNode;
import org.codehaus.groovy.ast.CodeVisitorSupport;
import org.codehaus.groovy.ast.builder.AstBuilder;
import org.codehaus.groovy.ast.expr.ArgumentListExpression;
import org.codehaus.groovy.ast.expr.Expression;
import org.codehaus.groovy.ast.expr.MethodCallExpression;
import org.codehaus.groovy.control.CompilePhase;

import java.io.File;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author iweerarathna
 */
class Deps {

    private final Map<String, Set<String>> callMap = new HashMap<String, Set<String>>();
    private final Map<String, List<Location>> locMap = new HashMap<String, List<Location>>();
    private boolean withLocs;

    public static void main(String[] args) {
        new Deps().scan(new File("/Users/iweerarathna/projects/insight/database/scripts/common"));
    }

    /**
     * Expect Arguments: <br/>
     * <ul>
     *     <li>`-p {path}` : Directory to find dependencies of files</li>
     * </ul>
     *
     * @param args arguments
     */
    static void process(String[] args) {
        // dependencies
        Map<String, String> argsMap = NHelper.argParser(args);
        process(argsMap);
    }

    static Object process(Map<String, String> input) {
        String path = input.get("root");
        boolean withLocs = Boolean.parseBoolean(input.getOrDefault("locations", "false"));
        File file = new File(path);
        if (!file.exists()) {
            System.out.println("The given script dir or file '" + path + "' does not exist!");
            return null;
        }

        return new Deps().scanAll(file, withLocs);
    }

    Object scanAll(File dir, boolean withLocs) {
        this.withLocs = withLocs;
        scan(dir);

        if (withLocs) {
            return locMap;
        } else {
            return callMap;
        }
    }

    void scan(File dirOrFile) {
        if (dirOrFile.isDirectory()) {
            File[] files = dirOrFile.listFiles();
            if (files != null) {
                for (File file : files) {
                    scan(file);
                }
            }

        } else {
            String fname = dirOrFile.getName().toLowerCase();
            if (fname.endsWith(".groovy") || fname.endsWith(".nyql")) {
                String content = NHelper.toContentStr(dirOrFile);
                DepsVisitor visitor = new DepsVisitor(withLocs);
                List<ASTNode> astNodes = new AstBuilder().buildFromString(CompilePhase.CONVERSION, false, content);
                for (ASTNode node : astNodes) {
                    if (!(node instanceof ClassNode)) {
                        node.visit(visitor);
                    }
                }

                if (withLocs) {
                    if (visitor.locs.size() > 0) {
                        locMap.put(dirOrFile.getPath(), visitor.locs);
                    }
                } else {
                    if (visitor.calls.size() > 0) {
                        callMap.put(dirOrFile.getPath(), visitor.calls);
                    }
                }
            }
        }
    }

    public Map<String, Set<String>> getCallMap() {
        return callMap;
    }

    public static class Location {
        private String call;
        private int line;
        private int offset;

        public String getCall() {
            return call;
        }

        public void setCall(String call) {
            this.call = call;
        }

        public int getLine() {
            return line;
        }

        public void setLine(int line) {
            this.line = line;
        }

        public int getOffset() {
            return offset;
        }

        public void setOffset(int offset) {
            this.offset = offset;
        }

        public Location(String call, int line, int offset) {
            this.call = call;
            this.line = line;
            this.offset = offset;
        }
    }

    private static class DepsVisitor extends CodeVisitorSupport {

        private Set<String> calls;
        private List<Location> locs;
        private boolean insideScriptCall;
        private boolean withLocs;

        private DepsVisitor(boolean withLocations) {
            this.withLocs = withLocations;
            if (withLocations) {
                locs = new LinkedList<>();
            } else {
                calls = new HashSet<>();
            }
        }

        @Override
        public void visitArgumentlistExpression(ArgumentListExpression ale) {
            if (insideScriptCall) {
                if (ale.getExpressions() != null && ale.getExpressions().size() == 1) {
                    Expression expression = ale.getExpression(0);
                    if (withLocs) {
                        locs.add(new Location(expression.getText(),
                                expression.getLineNumber(), expression.getColumnNumber()));
                    } else {
                        calls.add(expression.getText());
                    }
                }
            }
            super.visitArgumentlistExpression(ale);
        }

        @Override
        public void visitMethodCallExpression(MethodCallExpression call) {
            if (call.getMethodAsString().equals("$IMPORT")
                    || call.getMethodAsString().equals("RUN")
                    || call.getMethodAsString().equals("$IMPORT_SAFE")) {
                call.getObjectExpression().visit(this);
                call.getMethod().visit(this);
                insideScriptCall = true;
                call.getArguments().visit(this);
                insideScriptCall = false;
            } else {
                super.visitMethodCallExpression(call);
            }
        }
    }

    private static class AliasVisitor extends CodeVisitorSupport {

        private Map<String, String> aliases = new HashMap<String, String>();

        @Override
        public void visitMethodCallExpression(MethodCallExpression call) {
            if (call.getMethodAsString().equals("alias")) {
                String org = call.getObjectExpression().getText().replaceFirst("^this.", "");
                String text = org;
                if (text.endsWith(")")) {
                    // a functional method
                    text = text.substring(0, text.length() - 1);
                    if (text.startsWith("TABLE(")) {
                        text = text.substring("TABLE(".length());
                        System.out.println(text);
                    }
                } else {
                    String[] parts = text.split("[.]");
                    if (parts.length == 2) {
                        // a column
                        text = text + " - Column";
                    }
                    System.out.println(text + " [" + org + "]");
                }
            }
            super.visitMethodCallExpression(call);
        }
    }
}
