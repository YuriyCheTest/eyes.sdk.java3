package com.applitools.eyes.utils;

import com.applitools.eyes.*;
import com.applitools.eyes.metadata.SessionResults;
import com.applitools.eyes.selenium.Eyes;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.openqa.selenium.remote.DesiredCapabilities;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriBuilder;
import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

public class TestUtils {
    public final static boolean runOnCI = System.getenv("CI") != null;
    public final static boolean runHeadless = runOnCI || "true".equalsIgnoreCase(System.getenv("APPLITOOLS_RUN_HEADLESS"));
    public final static String logsPath = System.getenv("APPLITOOLS_LOGS_PATH");
    public final static SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy_MM_dd_HH_mm_ss_SSS");

    public static String initLogPath() {
        return initLogPath(Thread.currentThread().getStackTrace()[2].getMethodName());
    }
    public static SessionResults getSessionResults(String apiKey, TestResults results) throws java.io.IOException {
        String apiSessionUrl = results.getApiUrls().getSession();
        URI apiSessionUri = UriBuilder.fromUri(apiSessionUrl)
                .queryParam("format", "json")
                .queryParam("AccessToken", results.getSecretToken())
                .queryParam("apiKey", apiKey)
                .build();

        Client client = ClientBuilder.newClient();
        String srStr = client.target(apiSessionUri)
                .request(MediaType.APPLICATION_JSON)
                .get(String.class);

        ObjectMapper jsonMapper = new ObjectMapper();
        jsonMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        return jsonMapper.readValue(srStr, SessionResults.class);
    }

    public static String initLogPath(String methodName) {
        String dateTimeString = dateFormat.format(Calendar.getInstance().getTime());
        return logsPath + File.separator + "java" + File.separator + methodName + "_" + dateTimeString;
    }

    public static LogHandler initLogger() {
        return initLogger(Thread.currentThread().getStackTrace()[2].getMethodName());
    }

    public static LogHandler initLogger(String methodName) {
        LogHandler logHandler;
        if (!TestUtils.runOnCI && logsPath != null) {
            String path = initLogPath(methodName);
            logHandler = new FileLogger(path + File.separator + "log.log", false, true);
        } else {
            logHandler = new StdoutLogHandler(true);
        }
        return logHandler;
    }

    public static void setupLogging(Eyes eyes) {
        setupLogging(eyes, Thread.currentThread().getStackTrace()[2].getMethodName());
    }

    public static void setupLogging(Eyes eyes, String methodName) {
        LogHandler logHandler;
        if (!TestUtils.runOnCI && logsPath != null) {
            String path = initLogPath(methodName);
            logHandler = new FileLogger(path + File.separator + methodName + ".log", false, true);
            eyes.setDebugScreenshotsPath(path);
            eyes.setDebugScreenshotsPrefix(methodName + "_");
            eyes.setSaveDebugScreenshots(true);
        } else {
            logHandler = new StdoutLogHandler(true);
        }
        eyes.setLogHandler(logHandler);
    }

    public static void setFinalStatic(java.lang.Class klass, String fieldName, Object newValue) throws Exception {
        Field field = klass.getDeclaredField(fieldName);
        setFinalStatic(field, newValue);
    }

    public static void setFinalStatic(Field field, Object newValue) throws Exception {
        field.setAccessible(true);

        Field modifiersField = Field.class.getDeclaredField("modifiers");
        modifiersField.setAccessible(true);
        modifiersField.setInt(field, field.getModifiers() & ~Modifier.FINAL);

        field.set(null, newValue);
    }

    public static List<Object[]> generatePermutationsList(List<List<Object>> lists) {
        List<Object[]> result = new ArrayList<>();
        generatePermutations(lists, result, 0, null);
        return result;
    }

    public static Object[][] generatePermutations(List<List<Object>> lists) {
        List<Object[]> result = generatePermutationsList(lists);
        return result.toArray(new Object[0][0]);
    }

    @SafeVarargs
    public static Object[][] generatePermutations(List<Object>... lists) {
        return generatePermutations(Arrays.asList(lists));
    }

    private static void generatePermutations(List<List<Object>> lists, List<Object[]> result, int depth, List<Object> permutation) {
        if (depth == lists.size()) {
            if (permutation != null) {
                result.add(permutation.toArray());
            }
            return;
        }

        List<Object> listInCurrentDepth = lists.get(depth);
        for (Object newItem : listInCurrentDepth) {
            if (permutation == null || depth == 0) {
                permutation = new ArrayList<>();
            }

            permutation.add(newItem);
            generatePermutations(lists, result, depth + 1, permutation);
            permutation.remove(permutation.size() - 1);
        }
    }

}