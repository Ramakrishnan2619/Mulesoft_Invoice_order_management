---
name: mulesoft-cloudhub-deployment
description: End-to-end guide and workflow for preparing, compiling, troubleshooting, and deploying a MuleSoft 4 application from Anypoint Studio to CloudHub 2.0 and connecting it with live frontends like Netlify.
---

# MuleSoft CloudHub 2.0 End-to-End Deployment Skill

This skill documents the complete, battle-tested procedure for taking a Mule 4 application developed in Anypoint Studio and successfully deploying it to CloudHub 2.0, resolving common Exchange asset errors, Java 17 compatibility bugs, MUnit Windows container failures, Gmail SMTP authentication, and CORS integration with external frontends.

---

## 1. Prerequisites Checklist
- Anypoint Platform account (Sandbox environment access).
- Anypoint Studio (with Mule Runtime 4.4+ or 4.8+).
- Java 17 and Apache Maven 3.8+ installed locally.
- Google Account with 2-Step Verification enabled (if sending email notifications).

---

## 2. Phase 1: Anypoint Organization & POM Configuration

### A. The #1 Deployment Failure: "Failed to publish Exchange asset"
CloudHub 2.0 enforces that any application deployed must be published as an Exchange asset belonging to the organization's business group. If the `groupId` in `pom.xml` is anything other than your Anypoint Organization ID, CloudHub 2.0 rejects the deployment with:
```text
Application failed to deploy to CloudHub-US-East-2: Failed to publish Exchange asset for deployment to CloudHub 2.0
```

### B. Finding Your Anypoint Organization ID
1. Log into [Anypoint Platform](https://anypoint.mulesoft.com/).
2. Open the main navigation menu and click **Access Management**.
3. In the left sidebar, click **Business Groups**.
4. Click on your root business group name.
5. In the settings tab, locate **Business Group ID** (a UUID like `c0b3b568-6b6b-4ecf-9c75-2a6e9c369207`).

### C. Updating `pom.xml`
In your Mule project's `pom.xml`:
1. Set `<groupId>` to your exact Business Group ID:
   ```xml
   <groupId>YOUR-BUSINESS-GROUP-UUID</groupId>
   <artifactId>email_test1</artifactId>
   <version>1.0.0</version>
   <packaging>mule-application</packaging>
   ```

2. Add `<distributionManagement>` inside `<project>` for Anypoint Exchange v3 publishing:
   ```xml
   <distributionManagement>
       <repository>
           <id>anypoint-exchange-v3</id>
           <name>Anypoint Exchange</name>
           <url>https://maven.anypoint.mulesoft.com/api/v3/organizations/${project.groupId}/maven</url>
           <layout>default</layout>
       </repository>
   </distributionManagement>
   ```

3. Ensure `exchange-docs/home.md` exists:
   Create `exchange-docs/home.md` in the project root containing a short markdown description of the asset (Exchange requires this for asset metadata).

---

## 3. Phase 2: Build Stability & Java 17 Packaging

### A. Fixing the Windows MUnit Container Bug
When building Mule projects on Windows with Java 17, the embedded MUnit test runner container often fails to initialize, failing `mvn clean package`.
Add test-skipping flags inside the `mule-maven-plugin` configuration in `pom.xml`:
```xml
<plugin>
    <groupId>org.mule.tools.maven</groupId>
    <artifactId>mule-maven-plugin</artifactId>
    <version>4.8.0</version>
    <extensions>true</extensions>
    <configuration>
        <classifier>mule-application</classifier>
        <skipTests>true</skipTests>
        <skipMunitTests>true</skipMunitTests>
    </configuration>
</plugin>
```

### B. Java 17 Specification in `mule-artifact.json`
CloudHub 2.0 runs on Java 17. Update `mule-artifact.json` in the project root:
```json
{
  "minMuleVersion": "4.8.0",
  "javaSpecificationVersions": [
    "1.8",
    "17"
  ]
}
```

### C. Compile the Standalone Package
Run in the project root:
```powershell
mvn clean package -DskipTests=true -DskipMunitTests=true
```
This generates the standalone archive:
`target/{artifactId}-{version}-mule-application.jar`

---

## 4. Phase 3: Production Email & Cloud Networking

### A. Gmail SMTP Authentication (App Passwords)
Google deprecated "Less Secure Apps". Standard account passwords will fail with `535-5.7.8 Username and Password not accepted`.
1. Go to Google Account Settings -> **Security**.
2. Ensure **2-Step Verification** is turned ON.
3. Search for **App passwords** in the top search bar.
4. Create an App Password named "MuleSoft Bot".
5. Copy the 16-character code (e.g., `abcd efgh ijkl mnop`).

### B. Cloud Egress Considerations (Why Render/Free Hosts Fail)
Free cloud hosts (such as Render, Vercel Serverless, Railway Free) block all outbound TCP traffic on ports 25, 465, and 587 (`ETIMEDOUT`). CloudHub 2.0 allows outbound SMTP traffic on ports 465 and 587.

### C. Mule Email Configuration in `email_test1.xml`
```xml
<configuration-properties file="config.properties" doc:name="Configuration properties" />

<email:smtp-config name="Email_SMTP" doc:name="Email SMTP">
    <email:smtp-connection host="smtp.gmail.com" port="587" user="${email.user}" password="${email.password}">
        <email:properties>
            <email:property key="mail.smtp.starttls.enable" value="true" />
            <email:property key="mail.smtp.starttls.required" value="true" />
        </email:properties>
    </email:smtp-connection>
</email:smtp-config>
```

---

## 5. Phase 4: Deploying to CloudHub 2.0 (Browser Direct Upload)

Direct browser upload is the fastest, most reliable method because it bypasses local Studio Maven authentication and token expiration issues.

1. Open [Runtime Manager](https://anypoint.mulesoft.com/cloudhub/).
2. Select the **Sandbox** environment.
3. Click the blue **Deploy application** button in the top right.
4. Fill in the fields:
   - **Application Name**: Enter a globally unique name (e.g. `mule-order-app`).
   - **Target**: Select `CloudHub 2.0` (or `Shared Space` / `Cloudhub-US-East-2`).
   - **Application File**: Click **Upload file** and select `target/{artifactId}-{version}-mule-application.jar`.
5. Click **Deploy Application**.
6. CloudHub 2.0 provisions the container and streams logs.
7. Under **Settings** -> **Public Endpoint**, copy the public HTTPS URL (e.g. `https://mule-order-app-xxxx.usa-e2.cloudhub.io`).

---

## 6. Phase 5: CORS Preflight & Live Frontend Integration

### A. MuleSoft CORS Configuration
In your Mule HTTP Listener flow (`/api/orders`), handle both `OPTIONS` (preflight) and `POST`:
```xml
<http:listener config-ref="HTTP_Listener_config" path="/api/orders" allowedMethods="POST, OPTIONS">
    <http:response statusCode="#[vars.httpStatus default 200]">
        <http:headers><![CDATA[#[{
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }]]]></http:headers>
    </http:response>
</http:listener>

<choice doc:name="Choice CORS Check">
    <when expression="#[attributes.method == 'OPTIONS']">
        <ee:transform doc:name="CORS OK">
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{ "status": "CORS OK" }]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </when>
    <otherwise>
        <!-- Real business logic & email dispatch -->
    </otherwise>
</choice>
```

### B. Frontend Separation (Netlify / Vercel)
In the frontend Javascript (`index.html`), configure dynamic API base detection:
```javascript
function getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8081';
    }
    if (window.location.hostname.includes('cloudhub.io')) {
        return window.location.origin;
    }
    return 'https://YOUR-CLOUDHUB-APP-URL.cloudhub.io';
}
```
* The Mule application serves the frontend directly at `/` (`https://YOUR-APP.cloudhub.io/`).
* Alternatively, host the frontend on Netlify.
