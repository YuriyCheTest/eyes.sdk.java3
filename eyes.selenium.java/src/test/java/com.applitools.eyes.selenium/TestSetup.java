package com.applitools.eyes.selenium;

import com.applitools.eyes.*;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testng.ITest;
import org.testng.annotations.BeforeClass;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;

public abstract class TestSetup implements ITest {

    protected Eyes eyes;
    protected WebDriver driver;
    protected RemoteWebDriver webDriver;

    protected String testSuitName;

    protected String testedPageUrl = "http://applitools.github.io/demo/TestPages/FramesTestPage/";
    protected RectangleSize testedPageSize = new RectangleSize(800, 600);

    private String logsPath = System.getenv("APPLITOOLS_LOGS_PATH");

    protected Capabilities caps;
    private DesiredCapabilities desiredCaps = new DesiredCapabilities();

    private static BatchInfo batchInfo = new BatchInfo("Java3 Tests");

    protected HashSet<FloatingMatchSettings> expectedFloatingRegions = new HashSet<>();
    protected HashSet<Region> expectedIgnoreRegions = new HashSet<>();
    protected HashSet<Region> expectedLayoutRegions = new HashSet<>();
    protected HashSet<Region> expectedStrictRegions = new HashSet<>();
    protected HashSet<Region> expectedContentRegions = new HashSet<>();

    protected boolean compareExpectedRegions = false;

    protected String platform;
    protected boolean forceFPS;

    private String testName;

    @BeforeClass(alwaysRun = true)
    public void OneTimeSetUp() {

        // Initialize the eyes SDK and set your private API key.
        eyes = new Eyes();
        //eyes.setServerConnector(new ServerConnector());
        //eyes.setProxy(new ProxySettings("http://localhost:8888"));
        RemoteSessionEventHandler remoteSessionEventHandler = new RemoteSessionEventHandler(
                eyes.getLogger(), URI.create("http://localhost:3000/"), "MyAccessKey");
        remoteSessionEventHandler.setThrowExceptions(false);
        //eyes.addSessionEventHandler(remoteSessionEventHandler);

        LogHandler logHandler = new StdoutLogHandler(true);

        eyes.setLogHandler(logHandler);
        eyes.setStitchMode(StitchMode.CSS);

        eyes.setHideScrollbars(true);

        String batchId = System.getenv("APPLITOOLS_BATCH_ID");
        if (batchId != null) {
            batchInfo.setId(batchId);
        }

        eyes.setBatch(batchInfo);
    }

    protected void setExpectedIgnoreRegions(Region... expectedIgnoreRegions) {
        this.expectedIgnoreRegions = new HashSet<>(Arrays.asList(expectedIgnoreRegions));
    }

    protected void setExpectedLayoutRegions(Region... expectedLayoutRegions) {
        this.expectedLayoutRegions = new HashSet<>(Arrays.asList(expectedLayoutRegions));
    }

    protected void setExpectedStrictRegions(Region... expectedStrictRegions) {
        this.expectedStrictRegions = new HashSet<>(Arrays.asList(expectedStrictRegions));
    }

    protected void setExpectedContentRegions(Region... expectedContentRegions) {
        this.expectedContentRegions = new HashSet<>(Arrays.asList(expectedContentRegions));
    }

    protected void setExpectedFloatingsRegions(FloatingMatchSettings... expectedFloatingsRegions) {
        this.expectedFloatingRegions = new HashSet<>(Arrays.asList(expectedFloatingsRegions));
    }

    @SuppressWarnings("SpellCheckingInspection")
    public void beforeMethod(String methodName) {
        System.out.println();
        System.out.println("==== Starting Test ====");
        System.out.println(this);
        System.out.println();

        String fps = forceFPS ? "_FPS" : "";
        String testName = methodName + fps;
        testName = testName.replace('[', '_')
                .replace(' ', '_')
                .replace("]", "");

        String seleniumServerUrl = setupSpecialServers(testName);

        caps.merge(desiredCaps);

        String browserName = caps.getBrowserName();
        this.testName = testName + " " + browserName + " " + platform;

        try {
            webDriver = new RemoteWebDriver(new URL(seleniumServerUrl), caps);
        } catch (MalformedURLException ignored) {
        }

        //updateLogHandler(testName, browserName);

        eyes.clearProperties();
        eyes.addProperty("Selenium Session ID", webDriver.getSessionId().toString());
        eyes.addProperty("ForceFPS", forceFPS ? "true" : "false");
        eyes.addProperty("ScaleRatio", "" + eyes.getScaleRatio());
        eyes.addProperty("Agent ID", eyes.getFullAgentId());
        try {
            driver = eyes.open(webDriver, testSuitName, testName, testedPageSize);

            if (testedPageUrl != null) {
                driver.get(testedPageUrl);
            }

            eyes.setForceFullPageScreenshot(forceFPS);

            clearExpectedRegions();
        } catch (Exception ex) {
            eyes.abortIfNotClosed();
            webDriver.quit();
        }
    }

    private void clearExpectedRegions() {
        this.expectedIgnoreRegions.clear();
        this.expectedLayoutRegions.clear();
        this.expectedStrictRegions.clear();
        this.expectedContentRegions.clear();
        this.expectedFloatingRegions.clear();
    }

    private void updateLogHandler(String testName, String browserName) {

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy_MM_dd_HH_mm_ss_SSS");

        String extendedTestName = String.format("%s_%s_%s_%s",
                testName, browserName, platform, dateFormat.format(Calendar.getInstance().getTime()));

        LogHandler logHandler;

        if (System.getenv("CI") == null && logsPath != null) {
            String path = logsPath + File.separator + "java" + File.separator + extendedTestName;
            logHandler = new FileLogger(path + File.separator + testName + "_" + platform + ".log", true, true);
            eyes.setDebugScreenshotsPath(path);
            eyes.setDebugScreenshotsPrefix(testName + "_");
            eyes.setSaveDebugScreenshots(true);
        } else {
            logHandler = new StdoutLogHandler(false);
        }

        eyes.setLogHandler(logHandler);
    }

    @SuppressWarnings("SpellCheckingInspection")
    private String setupSpecialServers(String testName) {
        String seleniumServerUrl = System.getenv("SELENIUM_SERVER_URL");
        if (seleniumServerUrl.equalsIgnoreCase("http://ondemand.saucelabs.com/wd/hub")) {
            desiredCaps.setCapability("username", System.getenv("SAUCE_USERNAME"));
            desiredCaps.setCapability("accesskey", System.getenv("SAUCE_ACCESS_KEY"));
            //desiredCaps.setCapability("seleniumVersion", "3.11.0");

            if (caps.getBrowserName().equals("chrome")) {
                desiredCaps.setCapability("chromedriverVersion", "2.37");
            }

            desiredCaps.setCapability("platform", platform);
            desiredCaps.setCapability("name", testName + " (" + eyes.getFullAgentId() + ")");

        } else if (seleniumServerUrl.equalsIgnoreCase("http://hub-cloud.browserstack.com/wd/hub")) {
            seleniumServerUrl = "http://" + System.getenv("BROWSERSTACK_USERNAME") + ":" + System.getenv("BROWSERSTACK_ACCESS_KEY") + "@hub-cloud.browserstack.com/wd/hub";
            desiredCaps.setCapability("platform", platform);
            desiredCaps.setCapability("name", testName + " (" + eyes.getFullAgentId() + ")");
        }
        return seleniumServerUrl;
    }

    @Override
    public String getTestName() {
        return testName;
    }

    @Override
    public String toString() {
        return String.format("%s (%s, %s, force FPS: %s)",
                this.getClass().getSimpleName(),
                this.caps.getBrowserName(),
                this.platform,
                this.forceFPS);
    }
}
