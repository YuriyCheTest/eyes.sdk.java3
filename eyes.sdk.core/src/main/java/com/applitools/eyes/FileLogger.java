/*
 * Applitools software.
 */
package com.applitools.eyes;

import com.applitools.utils.ArgumentGuard;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

/**
 * Writes log messages to a file.
 */
public class FileLogger extends LogHandler {
    private final String filename;
    private final boolean append;
    private BufferedWriter fileWriter;

    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

    /**
     * Creates a new FileHandler instance.
     * @param filename  The file in which to save the logs.
     * @param append    Whether to append the logs if the current file exists,
     *                  or to overwrite the existing file.
     * @param isVerbose Whether to handle or ignore verbose log messages.
     */
    public FileLogger(String filename, boolean append, boolean isVerbose) {
        super(isVerbose);
        ArgumentGuard.notNullOrEmpty(filename, "filename");
        this.filename = filename;
        this.append = append;
        fileWriter = null;
    }

    /**
     * See {@link #FileLogger(String, boolean, boolean)}.
     * {@code filename} defaults to {@code eyes.log}, append defaults to
     * {@code true}.
     * @param isVerbose Whether to handle or ignore verbose log messages.
     */
    public FileLogger(boolean isVerbose) {
        this("eyes.log", true, isVerbose);
    }

    /**
     * Open the log file for writing.
     */
    public void open() {
        if (fileWriter != null) {
            return;
        }

        try {
            File file = new File(filename);
            File path = file.getParentFile();
            if (path != null && !path.exists()) {
                System.out.println("No Folder");
                boolean success = path.mkdirs();
                if (success) {
                    System.out.println("Folder created");
                } else {
                    System.out.printf("Failed creating folder %s%n", path.getAbsolutePath());
                }
            }

            fileWriter = new BufferedWriter(new FileWriter(file, append));
        } catch (IOException e) {
            throw new EyesException("Failed to create log file!", e);
        }
    }

    @Override
    public synchronized void onMessage(String message) {
        if (fileWriter != null) {
            synchronized (fileWriter) {
                try {
                    fileWriter.write(getFormattedTimeStamp() + " Eyes: " + message);
                    fileWriter.newLine();
                    fileWriter.flush();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * Close the log file for writing.
     */
    public void close() {
        try {
            if (fileWriter != null) {
                fileWriter.close();
            }
        } catch (IOException ignored) {
        }
        fileWriter = null;
    }

    @Override
    public boolean isOpen() {
        return fileWriter != null;
    }

    private String getFormattedTimeStamp() {
        return dateFormat.format(Calendar.getInstance().getTime());
    }

}
