import React from 'react';
import {
  ShieldCheck,
  FileText,
  RefreshCw,
  Truck,
  HelpCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════
export type PolicyType = 'privacy' | 'terms' | 'refund' | 'shipping' | 'contact' | null;

export interface PolicySection {
  heading: string;
  content: string;
}

export interface PolicyData {
  title: string;
  icon: React.ReactNode;
  effectiveDate?: string;
  lastUpdated?: string;
  intro: string;
  sections: PolicySection[];
}

// ═══════════════════════════════════════════════
// BUSINESS INFO CONSTANT - RAZORPAY COMPLIANCE
// ═══════════════════════════════════════════════
export const BIZ = {
  legalName: 'Sachin Rohidas Gunjal',
  brandName: 'Smile Jobs',
  type: 'Individual (Proprietorship)',
  address: {
    line1: 'Mu Pimpaldari, Post Chas',
    line2: 'Taluka Akole',
    city: 'Ahmednagar',
    state: 'Maharashtra',
    pincode: '422610',
    country: 'India (IN)',
  },
  email: 'info.smilejobs@gmail.com',
  supportEmail: 'hr@smilejobs.in',
  phone: '+91 9423168472',
  website: 'https://www.smilejobs.in',
  hours: 'Monday to Saturday, 10:00 AM – 7:00 PM IST',
  effective: 'January 1, 2026',
  updated: 'January 8, 2026',
};

export const fullAddress = `${BIZ.address.line1}, ${BIZ.address.line2}, ${BIZ.address.city} – ${BIZ.address.pincode}, ${BIZ.address.state}, ${BIZ.address.country}`;

// ═══════════════════════════════════════════════
// POLICY DATA — ALL 5 RAZORPAY-REQUIRED POLICIES
// ═══════════════════════════════════════════════
export const POLICIES: Record<Exclude<PolicyType, null>, PolicyData> = {
  privacy: {
    title: 'Privacy Policy',
    icon: <ShieldCheck className="w-6 h-6" />,
    effectiveDate: BIZ.effective,
    lastUpdated: BIZ.updated,
    intro: `${BIZ.brandName} ("we", "our", "us"), operated by ${BIZ.legalName}, is committed to protecting the privacy and personal data of every user who accesses our recruitment platform. This Privacy Policy explains how we collect, use, store, share, and protect your information in compliance with applicable Indian data protection laws and Razorpay payment processing guidelines.`,
    sections: [
      {
        heading: '1. Information We Collect',
        content: `We collect the following categories of information when you use ${BIZ.brandName}:

a) Personal Identification Information:
• Full legal name, date of birth, gender
• Email address and mobile phone number
• Government-issued ID numbers (Aadhaar, PAN Card)
• Postal address and current city of residence
• Passport-size photograph (optional)

b) Professional & Recruitment Information:
• Resume / Curriculum Vitae (CV)
• Work experience, employment history, and tenure details
• Educational qualifications, degrees, and certifications
• Technical skills, portfolio links, and code repositories
• Salary expectations and current compensation details
• Notice period and availability status

c) Verification & Authentication Data:
• UIDAI Aadhaar verification results (via OTP-based consent)
• EPFO (Employees' Provident Fund Organisation) records for employment verification
• Educational institution registrar confirmation data
• Corporate domain email verification status
• Phone carrier verification status

d) Payment & Transaction Information:
• Payment method selection (Card, UPI, Net Banking, Wallet)
• Transaction IDs and payment confirmation receipts
• Subscription plan and billing cycle details
• Profile Credit purchases (one-time pay-per-unlock credits)
• Note: Full card numbers and CVV are NEVER stored on our servers. All payment data is processed exclusively through Razorpay's PCI-DSS Level 1 compliant payment gateway.

e) Technical & Usage Data:
• IP address, browser type, and version
• Device type, operating system, and screen resolution
• Pages visited, time spent, click patterns, and scroll depth
• Referral source and campaign UTM parameters
• Cookies and local storage identifiers

f) Communication Data:
• Messages exchanged between recruiters and candidates on the platform
• Email notifications sent and received
• Support tickets and help desk correspondence`,
      },
      {
        heading: '2. How We Use Your Information',
        content: `We use collected information strictly for the following legitimate purposes:

• Account Creation & Authentication: To create, verify, and maintain your user account.
• Candidate Verification: To authenticate identity, employment history, and educational credentials through authorised government and institutional databases.
• Job Matching: To match verified candidate profiles with suitable job openings posted by recruiters.
• Communication: To facilitate messaging between recruiters and candidates, send transactional emails, job alerts, and platform notifications.
• Payment Processing: To process subscription payments, Profile Credit purchases, generate GST-compliant invoices, and manage billing through Razorpay.
• Credit Management: To track your purchased Profile Credits balance, usage history, and auto-unlock entitlements for candidate profiles.
• Platform Improvement: To analyse usage patterns, improve user experience, fix bugs, and develop new features.
• Legal Compliance: To comply with applicable Indian laws, tax regulations (7-year record retention under Income Tax Act), and respond to lawful government requests.
• Fraud Prevention: To detect, prevent, and investigate fraudulent activities, fake profiles, and platform abuse.
• Customer Support: To respond to your queries, complaints, and support requests.`,
      },
      {
        heading: '3. Data Sharing & Disclosure',
        content: `We share your personal data only in the following specific circumstances:

a) With Verified Recruiters: Candidate profiles (name, skills, experience, verification status) are shared with recruiters who have active paid subscriptions or valid Profile Credits on the platform. Sensitive data like Aadhaar numbers and PAN details are NEVER shared with recruiters.

b) With Verification Partners: We share limited data with UIDAI, EPFO, and educational institutions solely for the purpose of credential verification, always with your explicit consent.

c) With Payment Processor (Razorpay): Transaction-related data is shared with Razorpay Software Private Limited for secure payment processing. Razorpay's privacy policy applies to data they process. Visit https://razorpay.com/privacy/ for details.

d) Legal Requirements: We may disclose data when required by Indian law, court order, government authority, or regulatory body (e.g., Income Tax Department, RBI, CERT-In).

e) Business Transfers: In the event of a merger, acquisition, or sale of business assets, user data may be transferred to the successor entity with prior notice.

f) With Your Consent: For any purpose not listed above, we will seek your explicit consent before sharing data.

WE NEVER SELL, RENT, OR TRADE YOUR PERSONAL DATA TO THIRD PARTIES FOR MARKETING OR ADVERTISING PURPOSES.`,
      },
      {
        heading: '4. Data Security Measures',
        content: `We implement industry-standard security measures to protect your data:

• 256-bit SSL/TLS encryption for all data transmitted between your browser and our servers
• AES-256 encryption for sensitive data stored in our databases
• Regular security audits and penetration testing by certified security professionals
• Role-based access controls (RBAC) ensuring only authorised personnel can access user data
• Two-factor authentication (2FA) available for all user accounts
• Automatic session timeout after 30 minutes of inactivity
• Daily encrypted backups stored in geographically redundant data centres
• All payment data handled exclusively by Razorpay's PCI-DSS Level 1 compliant infrastructure
• DDoS protection and Web Application Firewall (WAF) enabled
• Incident response plan with 72-hour breach notification commitment`,
      },
      {
        heading: '5. Data Retention',
        content: `We retain your personal data for the following durations:

• Active Account Data: Retained as long as your account remains active and you continue using the platform.
• Inactive Accounts: If your account is inactive for 24 consecutive months, we will send a reactivation notice. If no response is received within 30 days, the account and associated data will be permanently deleted.
• Transaction Records: Retained for 7 years from the date of transaction as required under the Indian Income Tax Act, 1961, and GST Act, 2017.
• Profile Credit Records: Credit purchase history and unlock entitlements are retained for 7 years for audit and tax purposes.
• Verification Records: Retained for 5 years from the date of verification for audit trail purposes.
• Communication Logs: Retained for 2 years from the date of communication.
• Support Tickets: Retained for 3 years after resolution.

You may request early deletion of your data at any time (subject to legal retention requirements) by emailing ${BIZ.email}.`,
      },
      {
        heading: '6. Cookies & Tracking Technologies',
        content: `We use cookies and similar tracking technologies to enhance your experience:

a) Essential Cookies: Required for platform functionality (login sessions, security tokens). Cannot be disabled.
b) Analytics Cookies: Help us understand usage patterns and improve the platform. Can be disabled in browser settings.
c) Preference Cookies: Remember your settings, language, and display preferences.

We do NOT use third-party advertising or remarketing cookies. You can control cookie preferences through your browser settings. Disabling essential cookies may affect platform functionality.`,
      },
      {
        heading: '7. Your Rights',
        content: `Under Indian data protection laws and our commitment to transparency, you have the following rights:

• Right to Access: Request a copy of all personal data we hold about you.
• Right to Correction: Request correction of inaccurate or incomplete information.
• Right to Deletion: Request permanent deletion of your account and all associated data (subject to legal retention requirements).
• Right to Withdraw Consent: Withdraw your consent for data processing at any time. Note: This may affect your ability to use certain platform features.
• Right to Data Portability: Request your data in a structured, machine-readable format (JSON/CSV).
• Right to Object: Object to specific processing activities.
• Right to Complaint: Lodge a complaint with the relevant data protection authority.

To exercise any of these rights, email us at ${BIZ.email} with the subject line "Data Rights Request". We will respond within 30 days.`,
      },
      {
        heading: "8. Children's Privacy",
        content: `${BIZ.brandName} is not intended for individuals under 18 years of age. We do not knowingly collect, process, or store personal data from minors. If we discover that a minor has created an account, we will immediately delete the account and all associated data. If you believe a minor is using our platform, please report it to ${BIZ.email}.`,
      },
      {
        heading: '9. Third-Party Links',
        content: `Our platform may contain links to third-party websites (e.g., company career pages, portfolio sites, LinkedIn profiles). We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies before providing any personal information.`,
      },
      {
        heading: '10. International Data Transfers',
        content: `Your data is primarily stored and processed in India. If any data is transferred to servers located outside India (e.g., for backup or CDN purposes), we ensure that adequate safeguards are in place in compliance with applicable Indian data protection regulations.`,
      },
      {
        heading: '11. Changes to This Privacy Policy',
        content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes:

• We will update the "Last Updated" date at the top of this policy.
• We will notify registered users via email at least 7 days before changes take effect.
• Continued use of the platform after the effective date constitutes acceptance of the updated policy.

We encourage you to review this policy periodically.`,
      },
      {
        heading: '12. Grievance Officer & Contact',
        content: `For any privacy-related questions, concerns, or grievances, please contact:

Grievance Officer: ${BIZ.legalName}
Email: ${BIZ.email}
Phone: ${BIZ.phone}
Address: ${fullAddress}

Support Email: ${BIZ.supportEmail}
Support Hours: ${BIZ.hours}

We will acknowledge your grievance within 24 hours and resolve it within 30 days as per applicable Indian law.`,
      },
    ],
  },

  terms: {
    title: 'Terms and Conditions',
    icon: <FileText className="w-6 h-6" />,
    effectiveDate: BIZ.effective,
    lastUpdated: BIZ.updated,
    intro: `These Terms and Conditions ("Terms") govern your access to and use of ${BIZ.brandName} ("Platform"), operated by ${BIZ.legalName}. By creating an account, accessing, or using any part of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, please do not use our services.`,
    sections: [
      {
        heading: '1. Definitions',
        content: `For the purposes of these Terms:

• "Platform" refers to the ${BIZ.brandName} website, mobile application, and all associated digital services.
• "User" refers to any individual or entity that accesses or uses the Platform, including Candidates and Recruiters.
• "Candidate" refers to a job seeker who creates a profile on the Platform.
• "Recruiter" refers to a hiring manager, HR professional, or company representative who uses the Platform to find and hire candidates.
• "Services" refers to all features, tools, and functionalities offered through the Platform.
• "Content" refers to all text, images, data, profiles, job listings, and other materials uploaded to or generated on the Platform.
• "Subscription" refers to a paid recurring plan that grants access to premium features.
• "Profile Credits" refers to one-time, non-recurring credits purchased by recruiters to unlock verified candidate contact details (email, phone, resume).
• "We/Us/Our" refers to ${BIZ.legalName}, operating as ${BIZ.brandName}.`,
      },
      {
        heading: '2. Eligibility',
        content: `To use ${BIZ.brandName}, you must:

• Be at least 18 years of age.
• Be legally competent to enter into a binding contract under the Indian Contract Act, 1872.
• Provide accurate, truthful, and complete information during registration.
• Not have been previously suspended or removed from the Platform for Terms violations.

By using the Platform, you represent and warrant that you meet all eligibility requirements.`,
      },
      {
        heading: '3. Account Registration & Security',
        content: `• You must register an account to access most Platform features.
• You agree to provide accurate, current, and complete information during registration and keep it updated.
• You are solely responsible for maintaining the confidentiality of your account credentials (email, password, OTP).
• You must not share your account with any other individual or entity.
• You agree to immediately notify us at ${BIZ.email} of any unauthorised use of your account.
• We reserve the right to suspend or terminate accounts with false, misleading, or duplicate information.
• You are responsible for all activities that occur under your account.`,
      },
      {
        heading: '4. Services Offered',
        content: `${BIZ.brandName} provides the following digital services:

For Candidates (Free):
• Create verified professional profiles
• Upload resume, portfolio, and skill documentation
• Receive job match notifications
• Communicate with verified recruiters
• Access interview scheduling tools

For Recruiters (Subscription-based):
• Post job listings with detailed requirements
• Search and filter verified candidate profiles
• Access candidate verification reports
• Manage hiring pipeline with Kanban board
• Schedule interviews with calendar integration
• Access recruitment analytics and conversion metrics

For Recruiters (Pay-per-unlock Profile Credits):
• Purchase Profile Credits on-demand without a monthly subscription
• Each credit auto-unlocks one verified candidate profile revealing: Full Name, Verified Email, Phone Number, and secure Resume PDF download
• Credits never expire and remain in your account until used
• Credits work independently of subscription status
• All profiles are pre-filtered: minimum 50% profile completeness required AND resume must be uploaded
• Each credit unlocks a NEW profile (no duplicates per recruiter)

All services are delivered digitally through our online platform. No physical products are shipped or delivered.`,
      },
      {
        heading: '5. Payment Terms & Billing',
        content: `• All payments are processed securely through Razorpay Software Private Limited.
• Subscription fees are billed in advance on a monthly or annual basis as per the selected plan.
• Profile Credits are charged as one-time payments at the current per-credit price displayed at checkout.
• All prices are quoted in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST).
• Payment confirmation and GST-compliant invoices are sent to your registered email upon successful transaction.
• We accept the following payment methods via Razorpay: Credit Cards (Visa, Mastercard, RuPay, Amex), Debit Cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), and Mobile Wallets.
• Failed payments may result in temporary suspension of premium features until payment is successfully processed.
• Recurring subscriptions will auto-renew unless cancelled before the next billing cycle.
• Profile Credits are non-refundable once used but remain valid indefinitely until consumed.
• All billing disputes must be raised within 15 days of the transaction date.`,
      },
      {
        heading: '6. User Conduct & Prohibited Activities',
        content: `You agree NOT to:

• Post false, misleading, defamatory, or fraudulent information on the Platform.
• Create fake profiles, impersonate another person or entity, or misrepresent your qualifications.
• Upload offensive, obscene, discriminatory, or illegal content.
• Harass, threaten, stalk, or discriminate against other users based on race, gender, religion, caste, disability, or any protected characteristic.
• Use the Platform for any purpose that violates Indian law or any applicable international law.
• Attempt to hack, reverse-engineer, decompile, or compromise Platform security.
• Use automated bots, scrapers, or crawlers to extract data without written authorisation.
• Send unsolicited messages, spam, or bulk communications through the Platform.
• Share your account credentials with third parties.
• Share, resell, or redistribute candidate contact information obtained via Profile Credits to third parties.
• Post job listings that violate Indian labour laws, including discriminatory requirements.
• Circumvent payment mechanisms or attempt to access premium features without a valid subscription or credits.
• Use the Platform to collect personal data of users for purposes unrelated to recruitment.

Violation of any of these terms may result in immediate account suspension or permanent termination without refund.`,
      },
      {
        heading: '7. Intellectual Property Rights',
        content: `a) Platform IP: All content on ${BIZ.brandName}, including but not limited to the logo, brand name, UI/UX design, source code, algorithms, text, graphics, icons, and software, is the exclusive property of ${BIZ.legalName} and is protected under the Indian Copyright Act, 1957, and the Trademarks Act, 1999. Unauthorised reproduction, distribution, or modification is strictly prohibited.

b) User Content: You retain ownership of content you upload (resumes, photos, portfolios). By uploading content, you grant ${BIZ.brandName} a non-exclusive, worldwide, royalty-free licence to use, display, store, and distribute your content solely for the purpose of providing Platform services.

c) Recruiter Content: Job listings and company information uploaded by recruiters remain their intellectual property. We may display this content on the Platform and in email notifications.`,
      },
      {
        heading: '8. Verification Services Disclaimer',
        content: `• ${BIZ.brandName} verifies candidate credentials through authorised channels including UIDAI (Aadhaar), EPFO, and educational institution registrars.
• While we strive for maximum accuracy, we cannot guarantee 100% accuracy of third-party verification results.
• Verification results are provided "as-is" based on data received from government and institutional sources.
• Recruiters are strongly advised to conduct their own independent due diligence before making hiring decisions.
• ${BIZ.brandName} is not liable for any hiring decisions made based on verification reports provided through the Platform.`,
      },
      {
        heading: '9. Limitation of Liability',
        content: `To the maximum extent permitted by applicable Indian law:

• ${BIZ.brandName} is provided on an "as-is" and "as-available" basis.
• We do not warrant uninterrupted, error-free, or secure access to the Platform at all times.
• We are not liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
• We are not responsible for the accuracy of information provided by third-party verification partners.
• We are not liable for disputes between recruiters and candidates, including but not limited to hiring decisions, salary negotiations, or employment terms.
• Our total aggregate liability for any claim shall not exceed the total subscription fees or credit purchases paid by you in the 3 months immediately preceding the claim.
• We are not responsible for losses arising from unauthorised access to your account due to your failure to maintain credential security.`,
      },
      {
        heading: '10. Indemnification',
        content: `You agree to indemnify, defend, and hold harmless ${BIZ.legalName} (operating as ${BIZ.brandName}), its officers, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from:

• Your use of or conduct on the Platform.
• Your violation of these Terms.
• Your violation of any third-party rights (including intellectual property rights).
• Any content you upload or share on the Platform.
• Any misrepresentation of your qualifications, identity, or credentials.`,
      },
      {
        heading: '11. Account Suspension & Termination',
        content: `a) By You: You may deactivate or delete your account at any time through account settings or by emailing ${BIZ.email}.

b) By Us: We reserve the right to suspend or permanently terminate your account, without prior notice, for:
• Violation of these Terms or any applicable policy.
• Fraudulent, abusive, or illegal activity.
• Non-payment of subscription fees beyond 7 days of the due date.
• Creating multiple accounts or impersonating another user.
• Any activity that threatens the security or integrity of the Platform.

c) Effect of Termination:
• Access to all Platform features will be immediately revoked.
• Active subscription fees are non-refundable upon termination for Terms violation.
• Unused Profile Credits are forfeited upon termination for Terms violation.
• Your data will be handled as per our Privacy Policy and Data Retention guidelines.
• We may retain certain data as required by Indian law.`,
      },
      {
        heading: '12. Dispute Resolution & Governing Law',
        content: `• These Terms are governed by and construed in accordance with the laws of India.
• Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved through amicable negotiation within 30 days.
• If negotiation fails, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed mutually.
• The seat and venue of arbitration shall be Ahmednagar, Maharashtra, India.
• The language of arbitration shall be English.
• The courts in Ahmednagar, Maharashtra shall have exclusive jurisdiction over any legal proceedings.`,
      },
      {
        heading: '13. Force Majeure',
        content: `${BIZ.brandName} shall not be liable for any failure or delay in performing its obligations due to circumstances beyond its reasonable control, including but not limited to: natural disasters, pandemics, government actions, internet outages, power failures, server crashes, cyberattacks, or acts of war or terrorism.`,
      },
      {
        heading: '14. Severability',
        content: `If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.`,
      },
      {
        heading: '15. Entire Agreement',
        content: `These Terms, together with our Privacy Policy, Refund Policy, and Shipping Policy, constitute the entire agreement between you and ${BIZ.brandName} regarding your use of the Platform, superseding any prior agreements or understandings.`,
      },
      {
        heading: '16. Modifications to Terms',
        content: `We reserve the right to modify these Terms at any time. Material changes will be:
• Posted on this page with an updated "Last Updated" date.
• Communicated to registered users via email at least 7 days before taking effect.
• Continued use of the Platform after the effective date constitutes your acceptance of the modified Terms.`,
      },
      {
        heading: '17. Contact Information',
        content: `For questions about these Terms, contact:

${BIZ.legalName}
Business: ${BIZ.brandName}
Email: ${BIZ.email}
Support: ${BIZ.supportEmail}
Phone: ${BIZ.phone}
Address: ${fullAddress}
Support Hours: ${BIZ.hours}`,
      },
    ],
  },

  refund: {
    title: 'Refund & Cancellation Policy',
    icon: <RefreshCw className="w-6 h-6" />,
    effectiveDate: BIZ.effective,
    lastUpdated: BIZ.updated,
    intro: `This Refund and Cancellation Policy outlines the terms under which ${BIZ.legalName}, operating as ${BIZ.brandName}, handles refund requests, subscription cancellations, Profile Credit purchases, and billing disputes. We aim to be fair and transparent in all our refund dealings. All payments on ${BIZ.brandName} are processed through Razorpay Software Private Limited.`,
    sections: [
      {
        heading: '1. Subscription Plans, Profile Credits & Billing',
        content: `${BIZ.brandName} offers two distinct paid products:

A) Monthly/Annual Subscription Plans (recurring):
Visit the Pricing section of our platform for live, up-to-date subscription plan details fetched directly from our Razorpay-integrated backend. Pricing, features, and limits are dynamically rendered to ensure accuracy.

B) Profile Credits (one-time, pay-per-unlock):
• Each credit auto-unlocks ONE verified candidate profile revealing Name, Email, Phone, and Resume PDF.
• Credit pricing is displayed in real-time on the Profile Credits purchase page.
• Credits NEVER expire and remain in your account until consumed.
• Credits work without any active subscription.
• Each profile unlock is unique per recruiter — no duplicate charges.

All prices are in Indian Rupees (INR) and include applicable GST (18%). Candidate accounts are completely free. GST-compliant invoices are generated and emailed automatically upon every successful payment.`,
      },
      {
        heading: '2. Subscription Cancellation',
        content: `You may cancel your subscription at any time using the following methods:

a) Self-Service: Through your Account Settings > Subscription > Cancel Plan.
b) Email Request: Send a cancellation request to ${BIZ.email} from your registered email address.
c) Phone: Call us at ${BIZ.phone} during support hours.

Cancellation Terms:
• Cancellation takes effect at the END of your current paid billing cycle.
• You will continue to have access to all premium features until the billing period expires.
• No partial refunds are provided for the remaining days in the current billing cycle.
• Auto-renewal will be disabled immediately upon cancellation.
• You can reactivate your subscription at any time by choosing a new plan.
• Cancellation of annual plans follows the same policy — access continues until the annual period expires.
• IMPORTANT: Cancelling your subscription does NOT affect your purchased Profile Credits. They remain usable indefinitely.`,
      },
      {
        heading: '3. Profile Credit Cancellation & Refund',
        content: `Profile Credits are a non-recurring, pay-per-unlock product. The following terms apply:

• Credits are activated INSTANTLY upon successful payment and are added to your account balance.
• Unused credits can be refunded within 7 days of purchase ONLY if NO profile has been unlocked using any credit from that transaction.
• Once ANY credit from a purchase batch is used to unlock a profile, the ENTIRE batch becomes non-refundable (as the candidate data has been accessed).
• Credits are personal to your recruiter account and cannot be transferred to another account.
• Credits do not expire — they remain available until you choose to use them.
• There is no "cancellation" of credits — you simply stop using them if no longer needed.

To request a refund for completely unused credits, email ${BIZ.email} within 7 days of purchase with your transaction ID.`,
      },
      {
        heading: '4. Refund Eligibility',
        content: `Refunds MAY be approved under the following circumstances:

a) Technical Failure: If a verified platform-side technical issue prevented you from accessing paid features for more than 72 continuous hours during your billing cycle.

b) Duplicate Payment: If you were charged twice for the same billing cycle or credit purchase due to a payment processing error.

c) Billing Error: If you were charged an incorrect amount different from the displayed price.

d) Unauthorised Transaction: If a payment was made from your account without your authorisation (subject to investigation and verification).

e) Service Not Activated: If your premium features or Profile Credits were not activated within 24 hours of successful payment despite raising a support ticket.

f) Unused Credits: Profile Credits that have never been used can be refunded within 7 days of purchase.

Refunds will NOT be provided for:
• Change of mind or decision not to use the service after purchase.
• Failure to use subscribed features during the billing period.
• Account suspension or termination due to violation of Terms and Conditions.
• Dissatisfaction with candidate quality or hiring outcomes.
• Downtime caused by scheduled maintenance (communicated in advance).
• Third-party service failures beyond our control (e.g., Razorpay downtime, internet issues).
• Promotional, discounted, or trial subscriptions.
• Services used for more than 7 days from the purchase date.
• Profile Credit batches where ANY credit has been used to unlock a profile.`,
      },
      {
        heading: '5. Refund Request Process',
        content: `To request a refund, follow these steps:

Step 1: Email us at ${BIZ.email} within 7 calendar days of the transaction date.

Step 2: Include the following information in your email:
  • Subject line: "Refund Request – [Your Registered Email]"
  • Full name as registered on the platform
  • Registered email address
  • Transaction ID / Payment Reference Number
  • Date of transaction
  • Amount charged
  • Product type (Subscription / Profile Credits)
  • Detailed reason for refund request
  • Screenshots of error (if applicable)

Step 3: Our billing team will acknowledge your request within 24 hours (business days).

Step 4: Investigation and review will be completed within 3–5 business days.

Step 5: You will be notified of the decision (approved/rejected) via email with detailed reasoning.

Step 6: If approved, the refund will be initiated within 2 business days of approval.`,
      },
      {
        heading: '6. Refund Processing Timeline',
        content: `Once a refund is approved, the processing time depends on your original payment method:

• Credit Cards: 7–10 business days
• Debit Cards: 7–10 business days
• Net Banking: 5–7 business days
• UPI (Google Pay, PhonePe, Paytm): 3–5 business days
• Mobile Wallets: 3–5 business days
• International Cards: 10–14 business days

Important Notes:
• Refunds are always credited to the ORIGINAL payment method used for the transaction.
• We cannot process refunds to a different bank account, card, or payment method.
• Actual credit time may vary depending on your bank's or payment provider's processing schedule.
• You will receive an email confirmation with the Razorpay refund reference ID once the refund is initiated.
• For refund status queries, contact Razorpay support or email us at ${BIZ.email}.`,
      },
      {
        heading: '7. Partial Refunds',
        content: `In exceptional circumstances, we may offer partial refunds at our sole discretion. Partial refund calculation considers:

• Number of days the service was actively used vs. total billing period
• Number of Profile Credits consumed vs. purchased
• Features accessed during the subscription period
• Nature and severity of the issue reported
• Whether the issue was within our control

Partial refund decisions are final and are communicated with a detailed breakdown.`,
      },
      {
        heading: '8. Non-Refundable Items',
        content: `The following are strictly non-refundable under any circumstances:

• Profile Credits that have been used to unlock candidate profiles (even partially from a batch).
• Premium candidate profile boost charges (once the boost is activated).
• Verification charges (once the verification process is initiated with third-party agencies).
• One-time account setup or onboarding fees (if applicable).
• Promotional, discounted, or special offer subscriptions.
• Services consumed for more than 7 calendar days.
• Annual plan subscriptions after 14 calendar days from purchase.
• Add-on features purchased separately.
• Custom enterprise solutions after project initiation.`,
      },
      {
        heading: '9. Chargeback Policy',
        content: `• We strongly request that you contact us at ${BIZ.email} BEFORE initiating a chargeback or dispute with your bank or card issuer.
• Unauthorised or fraudulent chargebacks may result in immediate and permanent account suspension and forfeiture of all unused Profile Credits.
• We will provide complete transaction evidence (payment receipts, service delivery proof, credit usage logs, communication logs) to Razorpay and the issuing bank in case of disputes.
• Legitimate chargeback cases will be honoured as per Razorpay's dispute resolution guidelines and RBI regulations.
• If a chargeback is found to be invalid, we reserve the right to recover the disputed amount plus any chargeback fees incurred.`,
      },
      {
        heading: '10. Plan Downgrades',
        content: `• You may downgrade your subscription plan at any time.
• The downgrade takes effect at the start of the next billing cycle.
• No refund or credit is provided for the price difference in the current billing period.
• Feature access will be adjusted according to the new plan's entitlements.
• Any data exceeding the new plan's limits (e.g., active job postings) will be archived, not deleted.
• Profile Credits are independent of plans — they remain unaffected by subscription changes.`,
      },
      {
        heading: '11. Free Trial Policy',
        content: `• Some plans may offer a free trial period (typically 7 or 14 days).
• No payment is required during the trial period.
• At the end of the trial, you will be prompted to choose a paid plan.
• If no plan is selected, your account reverts to the free tier — no charges are applied.
• Free trials are limited to one per user/email address/organisation.
• Free trials do not include free Profile Credits.`,
      },
      {
        heading: '12. Contact for Refund Queries',
        content: `For all refund and billing-related queries:

Name: ${BIZ.legalName}
Business: ${BIZ.brandName}
Email: ${BIZ.email}
Support: ${BIZ.supportEmail}
Phone: ${BIZ.phone}
Support Hours: ${BIZ.hours}

Registered Address:
${BIZ.address.line1}
${BIZ.address.line2}
${BIZ.address.city} – ${BIZ.address.pincode}
${BIZ.address.state}, ${BIZ.address.country}

Payment Partner: Razorpay Software Private Limited
Razorpay Support: https://razorpay.com/support/`,
      },
    ],
  },

  shipping: {
    title: 'Shipping & Delivery Policy',
    icon: <Truck className="w-6 h-6" />,
    effectiveDate: BIZ.effective,
    lastUpdated: BIZ.updated,
    intro: `${BIZ.brandName}, operated by ${BIZ.legalName}, is a 100% digital recruitment platform. We do not sell, ship, or deliver any physical products or goods. All our services — including monthly subscriptions and Profile Credit purchases — are delivered electronically through our online platform. This Shipping & Delivery Policy is provided for transparency and compliance with Razorpay's payment gateway requirements.`,
    sections: [
      {
        heading: '1. Nature of Services',
        content: `${BIZ.brandName} is a Software-as-a-Service (SaaS) recruitment platform. All services are digital in nature and include:

• Verified candidate profile creation and management
• Job posting and publishing
• Candidate search and filtering tools
• Recruitment pipeline management (Kanban board)
• Interview scheduling and calendar integration
• Recruitment analytics and reporting
• Communication tools between recruiters and candidates
• Credential verification services
• Profile Credits for one-time candidate profile unlocks (reveal Name, Email, Phone, Resume)

No physical products, materials, or goods are involved in any transaction on our platform.`,
      },
      {
        heading: '2. Digital Service Delivery',
        content: `Upon successful payment, digital services are delivered as follows:

a) Subscription Activation:
• Premium subscription features are activated INSTANTLY upon successful payment confirmation from Razorpay.
• In rare cases of payment gateway delays, activation may take up to 30 minutes.
• If features are not activated within 1 hour of payment, please contact ${BIZ.email} with your transaction ID.

b) Profile Credit Delivery:
• Purchased Profile Credits are added to your recruiter account balance IMMEDIATELY upon successful payment.
• Qualifying candidate profiles (minimum 50% completeness + resume uploaded) are auto-revealed on your Profile Credits dashboard based on your available credit balance.
• Each credit unlocks a NEW profile — no duplicate charges per recruiter.
• Credits never expire; use them at your pace.

c) Account Access:
• Account registration confirmation email is sent within 2 minutes of successful sign-up.
• Login credentials are delivered to your registered email address.
• Check your spam/junk folder if you don't receive the email.

d) Verification Services:
• Candidate verification requests are initiated within 24 hours of submission.
• Verification results are typically available within 2–5 business days, depending on the verification type and third-party response time.

e) Job Posting:
• Job listings go live within 15 minutes of submission after automated content review.
• Featured/boosted listings are activated immediately upon payment.`,
      },
      {
        heading: '3. Service Availability',
        content: `• The platform is available 24 hours a day, 7 days a week, subject to scheduled and unscheduled maintenance.
• Scheduled maintenance windows are communicated at least 48 hours in advance via email and in-app notification.
• We target 99.5% uptime availability across all services.
• The platform is accessible via any modern web browser (Chrome, Firefox, Safari, Edge) on desktop, tablet, and mobile devices.
• No software download or installation is required.`,
      },
      {
        heading: '4. Service Delivery Confirmation',
        content: `You will receive the following confirmations upon service delivery:

• Payment Receipt: Emailed immediately after successful payment with transaction ID, amount, and GST details.
• Subscription Confirmation: Email confirming your plan, features, billing cycle, and next renewal date.
• Profile Credit Confirmation: Email confirming the number of credits purchased, per-credit price, total amount, and your updated balance.
• Invoice: GST-compliant tax invoice emailed within 24 hours of payment.
• Feature Activation: In-app notification confirming premium features or credits are active.

All confirmations are sent to your registered email address. Please ensure your email address is correct and up to date.`,
      },
      {
        heading: '5. Delivery Issues & Troubleshooting',
        content: `If you experience any issues with service delivery:

a) Subscription Not Activated:
• Wait 30 minutes and refresh the page.
• Log out and log back in.
• Check your payment status in Account Settings > Billing.
• If the issue persists, email ${BIZ.email} with your transaction ID.

b) Profile Credits Not Added:
• Refresh the Profile Credits dashboard.
• Check your Account > Billing > Credit History for the transaction.
• If credits do not appear within 15 minutes, email ${BIZ.email} with transaction ID and screenshot.

c) Email Not Received:
• Check your spam, junk, and promotions folders.
• Add ${BIZ.email} to your contacts/whitelist.
• Verify your registered email address in Account Settings.

d) Platform Access Issues:
• Clear your browser cache and cookies.
• Try a different browser or device.
• Disable browser extensions that may interfere.
• Check your internet connection.

e) Verification Delays:
• Verification timelines depend on third-party response times.
• You will be notified via email once verification is complete.
• For status updates, email ${BIZ.email}.`,
      },
      {
        heading: '6. No Physical Shipping',
        content: `To reiterate for absolute clarity:

• ${BIZ.brandName} does NOT ship any physical products.
• No courier, postal, or logistics services are involved.
• No shipping charges, delivery fees, or handling costs apply.
• There is no physical delivery address required from users.
• All services, including Profile Credits, are 100% digital and delivered electronically.`,
      },
      {
        heading: '7. Contact for Delivery Issues',
        content: `For any service delivery queries or issues:

Name: ${BIZ.legalName}
Business: ${BIZ.brandName}
Email: ${BIZ.email}
Support: ${BIZ.supportEmail}
Phone: ${BIZ.phone}
Support Hours: ${BIZ.hours}

Registered Address:
${fullAddress}`,
      },
    ],
  },

  contact: {
    title: 'Contact Us',
    icon: <HelpCircle className="w-6 h-6" />,
    intro: `We're here to help! Whether you have questions about our platform, need technical support, want to report an issue, or have feedback, our team is ready to assist you. Below are all the ways you can reach us.`,
    sections: [
      {
        heading: 'Business Information',
        content: `Legal Entity: ${BIZ.legalName}
Business Name: ${BIZ.brandName}
Business Type: ${BIZ.type}
Website: ${BIZ.website}`,
      },
      {
        heading: 'Registered Address',
        content: `${BIZ.legalName}
${BIZ.address.line1}
${BIZ.address.line2}
${BIZ.address.city} – ${BIZ.address.pincode}
${BIZ.address.state}
${BIZ.address.country}`,
      },
      {
        heading: 'Email Contacts',
        content: `General Inquiries & Billing: ${BIZ.email}
HR & Recruitment Support: ${BIZ.supportEmail}

For faster resolution, please include:
• Your registered email address
• A clear description of your issue
• Screenshots (if applicable)
• Transaction ID (for billing queries)`,
      },
      {
        heading: 'Phone Support',
        content: `Phone: ${BIZ.phone}
Support Hours: ${BIZ.hours}
Language: English, Hindi, Marathi`,
      },
      {
        heading: 'Response Time Commitment',
        content: `• Email Queries: Acknowledged within 24 hours, resolved within 48 hours on business days.
• Phone Calls: Immediate response during support hours.
• Urgent / Critical Issues: Priority response within 4 hours.
• Billing / Refund Queries: Resolved within 3–5 business days.
• Grievances: Acknowledged within 24 hours, resolved within 30 days as per Indian law.`,
      },
      {
        heading: 'Types of Support Available',
        content: `• Account & Profile Help: Registration, login issues, profile updates, password reset.
• Billing & Subscription: Payment issues, invoices, plan changes, refund requests.
• Profile Credits: Credit purchase help, unlock issues, balance queries, usage history.
• Technical Support: Platform bugs, feature issues, browser compatibility.
• Recruitment Support: Job posting help, candidate search tips, pipeline management.
• Verification Queries: Status updates on credential verification.
• Feedback & Suggestions: We love hearing from our users! Share ideas for platform improvement.
• Report Abuse: Report fake profiles, spam, harassment, or policy violations.`,
      },
      {
        heading: 'Grievance Redressal',
        content: `In accordance with Indian consumer protection laws, we have designated a Grievance Officer:

Grievance Officer: ${BIZ.legalName}
Email: ${BIZ.email}
Phone: ${BIZ.phone}
Address: ${fullAddress}

Grievance Process:
1. Submit your grievance via email with the subject line "Grievance – [Brief Description]"
2. You will receive an acknowledgement within 24 hours with a ticket number.
3. Our team will investigate and provide a resolution within 30 days.
4. If unsatisfied with the resolution, you may escalate to the appropriate consumer forum.`,
      },
      {
        heading: 'Social Media',
        content: `Follow us for updates, hiring tips, and platform news:

Website: ${BIZ.website}

We are committed to providing excellent support to every user of ${BIZ.brandName}. Don't hesitate to reach out — we're happy to help!`,
      },
    ],
  },
};