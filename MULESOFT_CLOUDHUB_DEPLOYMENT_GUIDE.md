# 🚀 Complete Engineering Guide: Deploying MuleSoft to CloudHub 2.0 & Live Frontend

> **Author**: Ramakrishnan S  
> **Architecture**: Anypoint Studio (Mule 4.8) ➔ CloudHub 2.0 (Runtime Fabric Sandbox) ➔ Gmail SMTP ➔ Netlify Modern Frontend  
> **Status**: Production Verified & Live

---

## 📌 Executive Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │            LIVE WEB PORTAL (NETLIFY)                   │
 │   URL: https://astounding-churros-f61ef2.netlify.app   │
 └──────────────────────────┬─────────────────────────────┘
                            │ HTTPS / REST (CORS)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │           MULESOFT CLOUDHUB 2.0 (24/7 CLOUD API)       │
 │   URL: https://mule-order-app-...usa-e2.cloudhub.io    │
 │                                                        │
 │   1. HTTP Listener (CORS Preflight + /api/orders)      │
 │   2. DataWeave 2.0 Stock & Discount Engine             │
 │   3. Mock Product & Mock Order Sub-flows               │
 │   4. <email:send> SMTP Transport Component             │
 └──────────────────────────┬─────────────────────────────┘
                            │ Outbound TLS (Port 587)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               GOOGLE GMAIL SMTP CLOUD                  │
 │   Host: smtp.gmail.com:587 (STARTTLS)                  │
 │   Auth: mulesoftautomatedbot@gmail.com                 │
 └──────────────────────────┬─────────────────────────────┘
                            │ Real-time Delivery
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │              CUSTOMER GMAIL INBOX                      │
 │   (Instant Luxury Invoice & Order Confirmation)        │
 └────────────────────────────────────────────────────────┘
```

---

## 🛠️ Phase 1: Anypoint Platform Alignment (The #1 Blocker)

### Problem: Exchange Asset Publication Rejection
When deploying to CloudHub 2.0, the platform automatically validates that the Mule package exists or can be published as an Exchange asset. If your `pom.xml` uses a generic `groupId` (e.g. `com.mycompany`), deployment fails with:
```text
Application failed to deploy to CloudHub-US-East-2: 
Failed to publish Exchange asset for deployment to CloudHub 2.0
```

### Solution:
1. **Find your Business Group ID**:
   * Navigate to `https://anypoint.mulesoft.com/`
   * Open **Access Management** ➔ **Business Groups**
   * Click your Organization / Business Group name
   * Copy the **Business Group ID** UUID (e.g., `c0b3b568-6b6b-4ecf-9c75-2a6e9c369207`)

2. **Configure `pom.xml`**:
   Set `<groupId>` to your exact Business Group ID:
   ```xml
   <groupId>c0b3b568-6b6b-4ecf-9c75-2a6e9c369207</groupId>
   <artifactId>email_test1</artifactId>
   <version>1.0.0</version>
   <packaging>mule-application</packaging>
   ```

3. **Add Exchange v3 Distribution Management**:
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

4. **Create `exchange-docs/home.md`**:
   Create a folder named `exchange-docs/` in the project root with a file `home.md` containing markdown documentation for Exchange.

---

## ⚙️ Phase 2: Build Stability & Java 17 Compatibility

### Problem 1: Windows MUnit Container Failures
On Windows running Java 17, the embedded MUnit test container often fails to start during `mvn clean package`, terminating the build with container startup errors.

### Fix:
In `pom.xml`, configure `mule-maven-plugin`:
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

### Problem 2: CloudHub 2.0 Java Specification
CloudHub 2.0 runs on **Java 17**. If `mule-artifact.json` only specifies Java 1.8, deployment will be rejected.

### Fix:
Update `mule-artifact.json` in the root of your project:
```json
{
  "minMuleVersion": "4.8.0",
  "javaSpecificationVersions": [
    "1.8",
    "17"
  ]
}
```

### Compile the Final Package:
Run in PowerShell / Terminal:
```powershell
mvn clean package -DskipTests=true -DskipMunitTests=true
```
The output file is created at:
`target/email_test1-1.0.0-mule-application.jar`

---

## 📧 Phase 3: Gmail SMTP & Cloud Networking

### 1. Google 2-Step Verification & App Password
Standard Google passwords do not work with automated SMTP clients.
* Go to [Google Account Security](https://myaccount.google.com/security).
* Turn ON **2-Step Verification**.
* Search for **App passwords**.
* Create an App Password for **MuleSoft Bot** and copy the 16-character code (e.g., `abcd efgh ijkl mnop`).

> ⚠️ **CRITICAL SECURITY BEST PRACTICE**:
> Never commit your 16-character App Password to public GitHub!
> Store it in `src/main/resources/config.properties` (added to `.gitignore`) or configure it directly in CloudHub Runtime Manager under the **Properties** tab.

### 2. Cloud Egress Secrets (Why Render Failed & CloudHub Succeeded)
* **Free tier cloud hosts (Render, Railway, Vercel Serverless)**: Block outbound TCP ports 25, 465, and 587 by default to prevent spam. Any connection to Gmail SMTP times out (`ETIMEDOUT`).
* **CloudHub 2.0**: Outbound port 25 is blocked, but **port 587 and port 465 are open**.

### 3. Mule SMTP Configuration in `email_test1.xml`
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

## ☁️ Phase 4: Direct CloudHub 2.0 Deployment (Fastest Method)

Bypassing Anypoint Studio's OAuth login dialogs avoids token expiry issues:

1. Open [Runtime Manager](https://anypoint.mulesoft.com/cloudhub/).
2. Select the **Sandbox** environment.
3. Click the blue **Deploy application** button.
4. Set:
   * **Application Name**: `mule-order-app` (check green tick).
   * **Target**: `CloudHub 2.0` (e.g. `Cloudhub-US-East-2` or `Shared Space`).
   * **Application File**: Click **Upload file** ➔ Select `target/email_test1-1.0.0-mule-application.jar`.
5. Click **Deploy Application**.
6. CloudHub 2.0 pulls the container image, extracts the jar, and transitions to **`Running`**.
7. Copy the **Public Ingress URL** under Settings.

---

## 🌐 Phase 5: CORS Preflight & Live Frontend Connection

### 1. Handle CORS in Mule HTTP Listener
Browsers send an `OPTIONS` request before sending a cross-origin `POST`. If MuleSoft does not handle `OPTIONS`, the browser blocks the checkout:
```xml
<http:listener config-ref="HTTP_Listener_config" path="/api/orders" allowedMethods="POST, OPTIONS">
    <http:response statusCode="#[vars.httpStatus default 200]">
        <http:headers><![CDATA[#[{
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }]]]></http:headers>
    </http:response>
</http:listener>

<choice doc:name="CORS Check">
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
        <!-- Process Order & Send Email -->
    </otherwise>
</choice>
```

### 2. Frontend Dynamic API Routing (`index.html`)
```javascript
function getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8081';
    }
    if (window.location.hostname.includes('cloudhub.io')) {
        return window.location.origin;
    }
    return 'https://mule-order-app-lpwhw5.5sc6y6-2.usa-e2.cloudhub.io';
}
```

### 3. Netlify Auto-Deploy Workflow
* The frontend is hosted on **Netlify** connected to GitHub `main`.
* Any UI changes (styling, buttons, layout, cart) pushed to GitHub **auto-deploy in ~15 seconds**.
* **Zero MuleSoft redeployment needed** for UI adjustments!

---

## 🏆 Summary of Key Milestones
1. **Live 24/7 MuleSoft CloudHub API**: `https://mule-order-app-lpwhw5.5sc6y6-2.usa-e2.cloudhub.io`
2. **Live Resume Frontend**: `https://astounding-churros-f61ef2.netlify.app/`
3. **Automated Order Invoices**: Dispatched straight to customer inboxes via real Gmail SMTP.
4. **Permanent Reusable Skill**: Available to any Antigravity agent in `.agents/skills/mulesoft-cloudhub-deployment/SKILL.md`.
