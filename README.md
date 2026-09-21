# 💎 AURA Haute Couture — MuleSoft CloudHub 2.0 Order & Invoice System

An enterprise-grade e-commerce order management and automated invoice dispatch system built with **MuleSoft 4 (Mule Runtime 4.8)**, deployed to **CloudHub 2.0**, and integrated with a modern responsive frontend hosted on **Netlify**.

---

## 🏛️ Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │            LIVE WEB PORTAL (NETLIFY)                   │
 │   Customer browses catalog, manages cart, & checks out │
 └──────────────────────────┬─────────────────────────────┘
                            │ HTTPS / JSON (CORS Enabled)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │           MULESOFT CLOUDHUB 2.0 (24/7 API)             │
 │                                                        │
 │   1. HTTP Listener (CORS Preflight + /api/orders)      │
 │   2. DataWeave 2.0 Dynamic Catalog & 10% VIP Discount  │
 │   3. Boutique Inventory & Stock Validation             │
 │   4. <email:send> SMTP Transport Component             │
 └──────────────────────────┬─────────────────────────────┘
                            │ Outbound TLS (Port 587)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               GOOGLE GMAIL SMTP CLOUD                  │
 │   smtp.gmail.com:587 (STARTTLS)                        │
 └──────────────────────────┬─────────────────────────────┘
                            │ Instant Automated Dispatch
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │              CUSTOMER INBOX (EMAIL RECEIPT)            │
 │   Delivered in real-time with formatted itemized invoice│
 └────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide for Friends & Developers

Follow these simple steps to run and deploy this MuleSoft project on your own Anypoint Platform account.

### 📋 Prerequisites
* **Java 17** (JDK 17)
* **Apache Maven 3.8+**
* **Anypoint Studio 7.x** (optional, for visual editing)
* A free **[MuleSoft Anypoint Platform](https://anypoint.mulesoft.com/login/signup)** account (30-day free trial)
* A **Gmail account** with 2-Step Verification enabled

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Ramakrishnan2619/Mulesoft_Invoice_order_management.git
cd Mulesoft_Invoice_order_management
```

---

### Step 2: Generate Your Google App Password (30 seconds)
Google requires a 16-character **App Password** for automated email sending (standard account passwords are not accepted):
1. Go to your Google Account Security: 👉 **[https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**
2. In the **App name** box, type `MuleSoft Bot`.
3. Click **Create**.
4. Google will display a 16-character password (e.g. `abcd efgh ijkl mnop`). Copy this password.

---

### Step 3: Configure Your Local Email Credentials
1. Duplicate the template file:
   ```bash
   cp src/main/resources/config.properties.example src/main/resources/config.properties
   ```
2. Open `src/main/resources/config.properties` and add your email and App Password:
   ```properties
   email.user=your_email@gmail.com
   email.password=your_16_character_app_password
   ```
   > 🔒 **Note**: `config.properties` is already added to `.gitignore`. Your personal credentials will **never** be committed to GitHub!

---

### Step 4: Link Your Anypoint Business Group ID
CloudHub 2.0 requires the `pom.xml` `<groupId>` to match your Anypoint Organization ID:
1. Log into **[Anypoint Platform](https://anypoint.mulesoft.com/)**.
2. Go to **Access Management** ➔ **Business Groups**.
3. Click on your root organization / business group name.
4. Copy the **Business Group ID** (a UUID like `c0b3b568-6b6b-4ecf-9c75-2a6e9c369207`).
5. Open `pom.xml` and update line 5 with your Business Group ID:
   ```xml
   <groupId>PASTE_YOUR_BUSINESS_GROUP_ID_HERE</groupId>
   <artifactId>email_test1</artifactId>
   <version>1.0.0</version>
   ```

---

### Step 5: Build the Deployable Package
Run the following Maven command in the project root:
```bash
mvn clean package -DskipTests=true -DskipMunitTests=true
```
When it finishes with `BUILD SUCCESS`, your deployable archive is created at:
📂 `target/email_test1-1.0.0-mule-application.jar`

---

### Step 6: Deploy to CloudHub 2.0 (Fastest Method)
1. In Anypoint Platform, open **Runtime Manager** (ensure **Sandbox** environment is selected).
2. Click the blue **Deploy application** button (top right).
3. Fill in the deployment form:
   * **Application Name**: Enter a unique name (e.g., `mule-order-service`).
   * **Deployment Target**: Select `CloudHub 2.0` (Shared Space).
   * **Application File**: Click **Upload file** ➔ Select the compiled `.jar` from `target/email_test1-1.0.0-mule-application.jar`.
4. *(Optional & Recommended for Production)*: Click the **Properties** tab and set:
   * `email.user` = `your_email@gmail.com`
   * `email.password` = `your_app_password` (click the lock icon to protect it).
5. Click **Deploy Application**.

CloudHub 2.0 will automatically provision the container and start your application. Under **Settings** ➔ **Public Endpoint**, copy your public live API URL!

---

### Step 7: Connect the Frontend (or Test via API)
1. Open `index.html` and update the CloudHub URL in `getApiBase()`:
   ```javascript
   function getApiBase() {
       return 'https://YOUR-APP-NAME.cloudhub.io';
   }
   ```
2. Open `index.html` in your browser (or host it on Netlify / GitHub Pages).
3. Add luxury fashion items to your shopping cart and click **Proceed to Checkout & Invoice**.
4. Check your Gmail inbox — your automated order invoice will arrive instantly!

---

## 🛡️ Security Best Practices
* **Never commit passwords to Git**: Keep credentials in `config.properties` (which is git-ignored) or inject them dynamically via CloudHub Runtime Manager Properties.
* **Rolling 24-Hour Limits**: Standard Gmail accounts have a 500 email/day limit. For high-volume production, connect Amazon SES, SendGrid, or Google Workspace SMTP.

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders` | Processes cart order, calculates 10% VIP discount, and sends invoice email |
| `POST` | `/api/customers` | Maps VIP customer profile into the directory |
| `GET` | `/api/mock/products/{id}` | Retrieves real-time boutique catalog item & stock status |
| `OPTIONS` | `/api/orders` | CORS preflight handler allowing cross-origin web browser requests |

---

## 👨‍💻 Project Maintainer
* **Author**: Ramakrishnan S
* **Repository**: [Mulesoft_Invoice_order_management](https://github.com/Ramakrishnan2619/Mulesoft_Invoice_order_management.git)
* **License**: MIT
