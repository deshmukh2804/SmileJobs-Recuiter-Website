import React, { useState, useEffect, useRef } from 'react';
import { AppRoute, Candidate, AuthUser } from '../types';
import { INITIAL_CANDIDATES } from '../mockData';
import {
  ShieldCheck,
  Search,
  Zap,
  Briefcase,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Check,
  X,
  Calendar,
  Menu,
  Mail,
  Phone,
  MapPinned,
  FileText,
  RefreshCw,
  Truck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Globe,
  AlertCircle,
} from 'lucide-react';


// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════
type PolicyType = 'privacy' | 'terms' | 'refund' | 'shipping' | 'contact' | null;

interface LandingViewProps {
  onNavigate: (route: AppRoute) => void;
  featuredCandidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onOpenInfo: (type: 'privacy' | 'terms' | 'contact' | 'refund' | 'shipping') => void;
  authUser: AuthUser | null;
}


// ═══════════════════════════════════════════════
// BUSINESS INFO CONSTANT - RAZORPAY COMPLIANCE
// ═══════════════════════════════════════════════
const BIZ = {
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

const fullAddress = `${BIZ.address.line1}, ${BIZ.address.line2}, ${BIZ.address.city} – ${BIZ.address.pincode}, ${BIZ.address.state}, ${BIZ.address.country}`;


// ═══════════════════════════════════════════════
// POLICY DATA — ALL 5 RAZORPAY-REQUIRED POLICIES
// ═══════════════════════════════════════════════

interface PolicySection {
  heading: string;
  content: string;
}

interface PolicyData {
  title: string;
  icon: React.ReactNode;
  effectiveDate?: string;
  lastUpdated?: string;
  intro: string;
  sections: PolicySection[];
}

const POLICIES: Record<Exclude<PolicyType, null>, PolicyData> = {
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
• Payment Processing: To process subscription payments, generate GST-compliant invoices, and manage billing through Razorpay.
• Platform Improvement: To analyse usage patterns, improve user experience, fix bugs, and develop new features.
• Legal Compliance: To comply with applicable Indian laws, tax regulations (7-year record retention under Income Tax Act), and respond to lawful government requests.
• Fraud Prevention: To detect, prevent, and investigate fraudulent activities, fake profiles, and platform abuse.
• Customer Support: To respond to your queries, complaints, and support requests.`,
      },
      {
        heading: '3. Data Sharing & Disclosure',
        content: `We share your personal data only in the following specific circumstances:

a) With Verified Recruiters: Candidate profiles (name, skills, experience, verification status) are shared with recruiters who have active paid subscriptions on the platform. Sensitive data like Aadhaar numbers and PAN details are NEVER shared with recruiters.

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
        heading: '8. Children\'s Privacy',
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
• "Subscription" refers to a paid plan that grants access to premium features.
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

All services are delivered digitally through our online platform. No physical products are shipped or delivered.`,
      },
      {
        heading: '5. Payment Terms & Billing',
        content: `• All payments are processed securely through Razorpay Software Private Limited.
• Subscription fees are billed in advance on a monthly or annual basis as per the selected plan.
• All prices are quoted in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST).
• Payment confirmation and GST-compliant invoices are sent to your registered email upon successful transaction.
• We accept the following payment methods via Razorpay: Credit Cards (Visa, Mastercard, RuPay, Amex), Debit Cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), and Mobile Wallets.
• Failed payments may result in temporary suspension of premium features until payment is successfully processed.
• Recurring subscriptions will auto-renew unless cancelled before the next billing cycle.
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
• Post job listings that violate Indian labour laws, including discriminatory requirements.
• Circumvent payment mechanisms or attempt to access premium features without a valid subscription.
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
• Our total aggregate liability for any claim shall not exceed the total subscription fees paid by you in the 3 months immediately preceding the claim.
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
    intro: `This Refund and Cancellation Policy outlines the terms under which ${BIZ.legalName}, operating as ${BIZ.brandName}, handles refund requests, subscription cancellations, and billing disputes. We aim to be fair and transparent in all our refund dealings. All payments on ${BIZ.brandName} are processed through Razorpay Software Private Limited.`,
    sections: [
      {
        heading: '1. Subscription Plans & Billing',
        content: `${BIZ.brandName} offers the following subscription plans for recruiters:

• Starter Plan: ₹2,499/month
• Professional Plan: ₹7,499/month
• Enterprise Plan: Custom pricing

All prices are in Indian Rupees (INR) and include applicable GST (18%). Candidate accounts are free of charge and do not require any payment.

Subscriptions are billed in advance at the beginning of each billing cycle (monthly or annual). GST-compliant invoices are generated and emailed automatically upon successful payment.`,
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
• Cancellation of annual plans follows the same policy — access continues until the annual period expires.`,
      },
      {
        heading: '3. Refund Eligibility',
        content: `Refunds MAY be approved under the following circumstances:

a) Technical Failure: If a verified platform-side technical issue prevented you from accessing paid features for more than 72 continuous hours during your billing cycle.

b) Duplicate Payment: If you were charged twice for the same billing cycle due to a payment processing error.

c) Billing Error: If you were charged an incorrect amount different from your plan price.

d) Unauthorised Transaction: If a payment was made from your account without your authorisation (subject to investigation and verification).

e) Service Not Activated: If your premium features were not activated within 24 hours of successful payment despite raising a support ticket.

Refunds will NOT be provided for:
• Change of mind or decision not to use the service after purchase.
• Failure to use subscribed features during the billing period.
• Account suspension or termination due to violation of Terms and Conditions.
• Dissatisfaction with candidate quality or hiring outcomes.
• Downtime caused by scheduled maintenance (communicated in advance).
• Third-party service failures beyond our control (e.g., Razorpay downtime, internet issues).
• Promotional, discounted, or trial subscriptions.
• Services used for more than 7 days from the purchase date.`,
      },
      {
        heading: '4. Refund Request Process',
        content: `To request a refund, follow these steps:

Step 1: Email us at ${BIZ.email} within 7 calendar days of the transaction date.

Step 2: Include the following information in your email:
  • Subject line: "Refund Request – [Your Registered Email]"
  • Full name as registered on the platform
  • Registered email address
  • Transaction ID / Payment Reference Number
  • Date of transaction
  • Amount charged
  • Detailed reason for refund request
  • Screenshots of error (if applicable)

Step 3: Our billing team will acknowledge your request within 24 hours (business days).

Step 4: Investigation and review will be completed within 3–5 business days.

Step 5: You will be notified of the decision (approved/rejected) via email with detailed reasoning.

Step 6: If approved, the refund will be initiated within 2 business days of approval.`,
      },
      {
        heading: '5. Refund Processing Timeline',
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
        heading: '6. Partial Refunds',
        content: `In exceptional circumstances, we may offer partial refunds at our sole discretion. Partial refund calculation considers:

• Number of days the service was actively used vs. total billing period
• Features accessed during the subscription period
• Nature and severity of the issue reported
• Whether the issue was within our control

Partial refund decisions are final and are communicated with a detailed breakdown.`,
      },
      {
        heading: '7. Non-Refundable Items',
        content: `The following are strictly non-refundable under any circumstances:

• Premium candidate profile boost charges (once the boost is activated)
• Verification charges (once the verification process is initiated with third-party agencies)
• One-time account setup or onboarding fees (if applicable)
• Promotional, discounted, or special offer subscriptions
• Services consumed for more than 7 calendar days
• Annual plan subscriptions after 14 calendar days from purchase
• Add-on features purchased separately
• Custom enterprise solutions after project initiation`,
      },
      {
        heading: '8. Chargeback Policy',
        content: `• We strongly request that you contact us at ${BIZ.email} BEFORE initiating a chargeback or dispute with your bank or card issuer.
• Unauthorised or fraudulent chargebacks may result in immediate and permanent account suspension.
• We will provide complete transaction evidence (payment receipts, service delivery proof, communication logs) to Razorpay and the issuing bank in case of disputes.
• Legitimate chargeback cases will be honoured as per Razorpay's dispute resolution guidelines and RBI regulations.
• If a chargeback is found to be invalid, we reserve the right to recover the disputed amount plus any chargeback fees incurred.`,
      },
      {
        heading: '9. Plan Downgrades',
        content: `• You may downgrade your subscription plan at any time.
• The downgrade takes effect at the start of the next billing cycle.
• No refund or credit is provided for the price difference in the current billing period.
• Feature access will be adjusted according to the new plan's entitlements.
• Any data exceeding the new plan's limits (e.g., active job postings) will be archived, not deleted.`,
      },
      {
        heading: '10. Free Trial Policy',
        content: `• Some plans may offer a free trial period (typically 7 or 14 days).
• No payment is required during the trial period.
• At the end of the trial, you will be prompted to choose a paid plan.
• If no plan is selected, your account reverts to the free tier — no charges are applied.
• Free trials are limited to one per user/email address/organisation.`,
      },
      {
        heading: '11. Contact for Refund Queries',
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
    intro: `${BIZ.brandName}, operated by ${BIZ.legalName}, is a 100% digital recruitment platform. We do not sell, ship, or deliver any physical products or goods. All our services are delivered electronically through our online platform. This Shipping & Delivery Policy is provided for transparency and compliance with Razorpay's payment gateway requirements.`,
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

No physical products, materials, or goods are involved in any transaction on our platform.`,
      },
      {
        heading: '2. Digital Service Delivery',
        content: `Upon successful payment, digital services are delivered as follows:

a) Subscription Activation:
• Premium subscription features are activated INSTANTLY upon successful payment confirmation from Razorpay.
• In rare cases of payment gateway delays, activation may take up to 30 minutes.
• If features are not activated within 1 hour of payment, please contact ${BIZ.email} with your transaction ID.

b) Account Access:
• Account registration confirmation email is sent within 2 minutes of successful sign-up.
• Login credentials are delivered to your registered email address.
• Check your spam/junk folder if you don't receive the email.

c) Verification Services:
• Candidate verification requests are initiated within 24 hours of submission.
• Verification results are typically available within 2–5 business days, depending on the verification type and third-party response time.

d) Job Posting:
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
• Invoice: GST-compliant tax invoice emailed within 24 hours of payment.
• Feature Activation: In-app notification confirming premium features are active.

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

b) Email Not Received:
• Check your spam, junk, and promotions folders.
• Add ${BIZ.email} to your contacts/whitelist.
• Verify your registered email address in Account Settings.

c) Platform Access Issues:
• Clear your browser cache and cookies.
• Try a different browser or device.
• Disable browser extensions that may interfere.
• Check your internet connection.

d) Verification Delays:
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
• All services are 100% digital and delivered electronically.`,
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


// ═══════════════════════════════════════════════
// POLICY MODAL COMPONENT — FULL FEATURED
// ═══════════════════════════════════════════════
const PolicyModal: React.FC<{
  type: Exclude<PolicyType, null>;
  onClose: () => void;
  onSwitchPolicy: (type: Exclude<PolicyType, null>) => void;
}> = ({ type, onClose, onSwitchPolicy }) => {
  const policy = POLICIES[type];
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start with all sections expanded for Razorpay review
    setAllExpanded(true);
    setExpandedSections(new Set(policy.sections.map((_, i) => i)));
    contentRef.current?.scrollTo({ top: 0 });
  }, [type, policy.sections]);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(policy.sections.map((_, i) => i)));
    }
    setAllExpanded(!allExpanded);
  };

  const policyTabs: { key: Exclude<PolicyType, null>; label: string }[] = [
    { key: 'privacy', label: 'Privacy' },
    { key: 'terms', label: 'Terms' },
    { key: 'refund', label: 'Refunds' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'contact', label: 'Contact' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={policy.title}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2C1B57] to-[#42326E] text-white px-4 sm:px-8 py-5 sm:py-6 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {policy.icon}
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold">{policy.title}</h2>
                {policy.effectiveDate && (
                  <p className="text-xs text-white/70 mt-0.5">
                    Effective: {policy.effectiveDate} · Updated: {policy.lastUpdated}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Policy Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
            {policyTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSwitchPolicy(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  type === tab.key
                    ? 'bg-white text-[#2C1B57] shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div ref={contentRef} className="overflow-y-auto flex-1 px-4 sm:px-8 py-5 sm:py-6">
          {/* Business Info Banner */}
          <div className="bg-[#F7F4FA] border border-[#E8E3EF] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#42326E] shrink-0" />
            <div className="text-xs text-[#49454F] leading-relaxed">
              <strong className="text-[#2C1B57]">{BIZ.brandName}</strong> is operated by{' '}
              <strong className="text-[#2C1B57]">{BIZ.legalName}</strong> ({BIZ.type}) from{' '}
              {BIZ.address.city}, {BIZ.address.state}, India. All payments are securely processed by Razorpay.
            </div>
          </div>

          {/* Introduction */}
          <p className="text-sm text-[#49454F] leading-relaxed mb-6">{policy.intro}</p>

          {/* Expand/Collapse All */}
          <div className="flex items-center justify-end mb-3">
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] font-bold text-[#42326E] flex items-center gap-1 hover:underline"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Expand All
                </>
              )}
            </button>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            {policy.sections.map((section, idx) => {
              const isOpen = expandedSections.has(idx);
              return (
                <div
                  key={idx}
                  className="border border-[#E8E3EF] rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-[#FCFCF7] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-[#2C1B57]">{section.heading}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6F687A] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6F687A] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 pt-1">
                      <p className="text-sm text-[#49454F] leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Contact Section at Bottom of Every Policy */}
          <div className="mt-8 bg-[#2C1B57] rounded-2xl p-5 sm:p-6 text-white">
            <h3 className="text-sm font-extrabold mb-4">Need Help? Contact Us Directly</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-[#B29CFE] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white/90">Email</p>
                  <a href={`mailto:${BIZ.email}`} className="text-[#B29CFE] hover:text-white break-all">
                    {BIZ.email}
                  </a>
                  <br />
                  <a href={`mailto:${BIZ.supportEmail}`} className="text-[#B29CFE] hover:text-white">
                    {BIZ.supportEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-[#B29CFE] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white/90">Phone</p>
                  <a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="text-[#B29CFE] hover:text-white">
                    {BIZ.phone}
                  </a>
                  <p className="text-white/60 mt-1">{BIZ.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPinned className="w-4 h-4 text-[#B29CFE] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white/90">Address</p>
                  <p className="text-white/70">{BIZ.address.line1}</p>
                  <p className="text-white/70">{BIZ.address.line2}</p>
                  <p className="text-white/70">
                    {BIZ.address.city} – {BIZ.address.pincode}
                  </p>
                </div>
              </div>
            </div>

            {type === 'contact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/15">
                <a
                  href={`mailto:${BIZ.email}`}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#2C1B57] rounded-xl font-bold text-sm hover:bg-[#FCFCF7] transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Us Now
                </a>
                <a
                  href={`tel:${BIZ.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Us Now
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-8 py-4 border-t border-[#E8E3EF] bg-[#FCFCF7] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#6F687A] text-center sm:text-left">
            © 2026 {BIZ.brandName} · {BIZ.legalName} · {BIZ.address.city}, {BIZ.address.state}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 text-[11px] font-bold text-[#42326E] hover:bg-[#EDE6FA] rounded-lg transition-colors"
            >
              Back to Top
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#42326E] text-white rounded-lg text-xs font-bold hover:bg-[#322554] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════
// APP LOGO COMPONENT
// ═══════════════════════════════════════════════
const AppLogo = ({ className = 'w-8 h-8' }: { className?: string }) => {
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoFailed) {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-br from-[#42326E] to-[#2C1B57] flex items-center justify-center text-white font-extrabold shadow-md shrink-0`}
      >
        <span style={{ fontSize: '0.4em' }}>SJ</span>
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Smile Jobs"
      className={`object-contain shrink-0 ${className}`}
      style={{ display: 'inline-block', minWidth: '1rem', minHeight: '1rem' }}
      onError={() => setLogoFailed(true)}
    />
  );
};


// ═══════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════
const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();


// ═══════════════════════════════════════════════
// MAIN LANDING VIEW COMPONENT
// ═══════════════════════════════════════════════
export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  featuredCandidates,
  onSelectCandidate,
  onOpenInfo,
  authUser,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activePreviewTab, setActivePreviewTab] = useState<'pipeline' | 'audit' | 'velocity'>('pipeline');
  const [talentRoleFilter, setTalentRoleFilter] = useState<'all' | 'Design' | 'Engineering' | 'Analytics' | 'Product'>('all');
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<number>(0);
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyType>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (activePolicyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activePolicyModal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 1024) return;
    const rect = heroRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px * 2, y: -py * 2 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const openPolicy = (type: Exclude<PolicyType, null>) => {
    setActivePolicyModal(type);
  };

  const displayTalent = (authUser ? featuredCandidates : INITIAL_CANDIDATES).filter((c) => {
    if (talentRoleFilter === 'all') return true;
    if (talentRoleFilter === 'Design') return c.department === 'Design';
    if (talentRoleFilter === 'Engineering') return c.department === 'Engineering' || c.department === 'Infrastructure';
    if (talentRoleFilter === 'Analytics') return c.role.toLowerCase().includes('data') || c.role.toLowerCase().includes('analyst');
    if (talentRoleFilter === 'Product') return c.department === 'Product' || c.role.toLowerCase().includes('growth');
    return true;
  });

  const showcaseItems = [
    {
      title: 'Cryptographic Credential Audit',
      subtitle: 'Zero false resumes. Ever.',
      description:
        'Every applicant is pre-verified against government ID records, corporate domain email confirmation, verified salary tax slips, and educational registrar databases before landing in your pipeline.',
      badge: '94.6% Trust Rating',
      icon: ShieldCheck,
      color: '#5F8A72',
      metrics: [
        { label: 'Government ID', value: '100% Cleared' },
        { label: 'Tenure Audits', value: 'Tax-matched' },
        { label: 'Degree Records', value: 'Registrar Verified' },
      ],
    },
    {
      title: 'Real-Time Pipeline Velocity',
      subtitle: '48 hours from post to shortlist',
      description:
        'Move candidates dynamically between 6 automated stages. Trigger automated candidate alerts, panel calendar invites, and candidate feedback notes without leaving the board.',
      badge: '3.2x Faster Hiring',
      icon: Zap,
      color: '#42326E',
      metrics: [
        { label: 'Median Shortlist', value: '48 Hours' },
        { label: 'Time-to-Offer', value: '18 Days' },
        { label: 'Offer Acceptance', value: '88.2%' },
      ],
    },
    {
      title: 'Algorithmic Precision Match',
      subtitle: 'Skill-verified compatibility scoring',
      description:
        'Our proprietary scoring engine analyzes authentic code repositories, verified design portfolios, and proven tenure to generate a transparent compatibility score for every opening.',
      badge: '96% Accuracy',
      icon: Sparkles,
      color: '#B29CFE',
      metrics: [
        { label: 'Role Alignment', value: 'Multi-factor' },
        { label: 'Availability', value: 'Real-time sync' },
        { label: 'Compensation Fit', value: 'Pre-aligned' },
      ],
    },
    {
      title: 'Frictionless Interview Sync',
      subtitle: 'Meet and Zoom in one click',
      description:
        "Say goodbye to 10-email scheduling chains. Candidates pick live panel slots directly synced with your hiring manager's Google Calendar and Microsoft Teams.",
      badge: 'Zero Scheduling Lag',
      icon: Calendar,
      color: '#C58A3A',
      metrics: [
        { label: 'Calendar Sync', value: 'Google / Zoom' },
        { label: 'Candidate Reschedule', value: 'Self-serve' },
        { label: 'Feedback Prompts', value: 'Instant' },
      ],
    },
  ];

  return (
    <div className="landing-page min-h-screen bg-[#FCFCF7] text-[#29233A] flex flex-col selection:bg-[#EDE6FA] selection:text-[#322554] overflow-x-hidden">
      <div className="landing-ambient pointer-events-none absolute inset-x-0 top-0 h-[820px]" aria-hidden="true" />

      {/* ═══════════════════════════════════════════ */}
      {/* POLICY MODAL (rendered at top for z-index) */}
      {/* ═══════════════════════════════════════════ */}
      {activePolicyModal && (
        <PolicyModal
          type={activePolicyModal}
          onClose={() => setActivePolicyModal(null)}
          onSwitchPolicy={(p) => setActivePolicyModal(p)}
        />
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* NAVIGATION BAR                              */}
      {/* ═══════════════════════════════════════════ */}
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FCFCF7]/90 backdrop-blur-xl border-b border-[#2C1B57]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 h-[74px] flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 font-extrabold text-xl text-[#2C1B57] cursor-pointer group shrink-0"
            aria-label="Smile Jobs, back to top"
          >
            <AppLogo className="w-10 h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300" />
            <span className="tracking-tight text-xl font-extrabold text-[#2C1B57]">Smile Jobs</span>
          </button>

          <div className="hidden lg:flex items-center gap-9 text-xs uppercase tracking-wider font-bold text-[#49454F]">
            {[
              { label: 'Platform', href: '#platform' },
              { label: 'Showcase', href: '#showcase' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Comparison', href: '#comparison' },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[#2C1B57] transition-colors relative py-1 group">
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
              </a>
            ))}
            <button onClick={() => onNavigate('candidates')} className="hover:text-[#2C1B57] transition-colors text-left relative py-1 group">
              Talent Directory
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-[#2C1B57] transition-colors text-left relative py-1 group">
              Console
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {authUser ? (
              <button
                onClick={() => onNavigate('profile')}
                className="landing-profile-link flex items-center gap-2 rounded-full border border-[#DAD1E8] bg-white/85 py-1.5 pl-1.5 pr-3 text-xs font-bold text-[#2C1B57] shadow-sm transition-all hover:border-[#B29CFE] hover:shadow-md"
              >
                {authUser.avatar?.url ? (
                  <img src={authUser.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2C1B57] text-white">
                    {(authUser.name || 'R').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:block max-w-28 truncate">{authUser.name || 'My profile'}</span>
              </button>
            ) : (
              <button onClick={() => onNavigate('login')} className="px-3 sm:px-4 py-2 text-xs md:text-sm font-bold text-[#2C1B57] hover:bg-white/80 rounded-xl transition-all">
                Sign in
              </button>
            )}
            <button
              onClick={() => onNavigate('post-job')}
              className="hidden sm:flex px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 items-center gap-1.5"
            >
              <span>Post a Job Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl text-[#2C1B57] hover:bg-white"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#E8E3EF] bg-[#FCFCF7]/95 px-5 py-4 shadow-xl flex flex-col gap-1">
            {[
              ['Platform', '#platform'],
              ['Showcase', '#showcase'],
              ['Pricing', '#pricing'],
              ['Comparison', '#comparison'],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileNavOpen(false)} className="px-3 py-3 rounded-xl text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">
                {label}
              </a>
            ))}
            <button onClick={() => { setMobileNavOpen(false); onNavigate('candidates'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">
              Talent directory
            </button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('dashboard'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">
              Recruiter console
            </button>
            <hr className="border-[#E8E3EF] my-1" />
            <button onClick={() => { setMobileNavOpen(false); openPolicy('privacy'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Privacy Policy</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('terms'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Terms & Conditions</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('refund'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Refund Policy</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('contact'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Contact Us</button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('post-job'); }} className="mt-2 px-3 py-3 rounded-xl text-left text-sm font-semibold text-white bg-[#42326E]">
              Post a Job Free
            </button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION                                */}
      {/* ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative pt-14 sm:pt-20 lg:pt-24 pb-28 sm:pb-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center"
      >
        <div className="lg:col-span-6 space-y-7 sm:space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DAD1E8] bg-white/75 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#42326E] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 landing-status-dot" />
            <span>Verified talent infrastructure</span>
          </div>

          <h1 className="text-[clamp(2.9rem,5.1vw,4.75rem)] font-extrabold tracking-[-0.045em] text-[#2C1B57] leading-[1.04] max-w-[12ch]">
            Great hires start with <span className="text-[#7359B4]">certainty.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#49454F] leading-relaxed max-w-[52ch] font-normal">
            Meet verified talent, see the evidence behind every profile, and move from first look to interview in one calm workspace.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button onClick={() => onNavigate('post-job')} className="px-7 py-4 text-sm font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
              <span>Post a Job Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('candidates')} className="px-7 py-4 text-sm font-bold text-[#2C1B57] bg-white border border-[#E8E3EF] hover:border-[#B29CFE] hover:bg-white rounded-2xl shadow-xs transition-all flex items-center gap-2">
              <Search className="w-4 h-4 text-[#42326E]" />
              <span>Explore Verified Talent</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#49454F]">
            {['Verified profiles', 'Secure payments via Razorpay', 'Interview-ready talent'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#5F8A72]" />
                {item}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-7 border-t border-[#DAD1E8] max-w-xl">
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">48 hrs</div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">Median time to shortlist</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">94.6%</div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">Audit pass fidelity</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">6,200+</div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">Companies hiring</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Dashboard Mockup */}
        <div className="lg:col-span-6 relative landing-device-wrap">
          <span className="absolute -top-8 right-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#76698D]">Illustrative product preview</span>
          <div
            className="w-full bg-[#2C1B57] text-white rounded-3xl p-6 sm:p-7 shadow-[0_32px_80px_-20px_rgba(44,27,87,0.35)] relative overflow-hidden transition-transform duration-300 ease-out border border-white/15 ring-1 ring-black/10"
            style={{ transform: `perspective(1100px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#B29CFE]/30 via-[#6E5B9A]/15 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#7CE0B0]/15 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-2 text-xs text-white/50 font-semibold tracking-wide flex items-center gap-1.5">
                  <AppLogo className="w-4 h-4 rounded" />
                  Smile Jobs Recruiter OS
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {(['pipeline', 'audit', 'velocity'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePreviewTab(tab)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all capitalize ${
                      activePreviewTab === tab ? 'bg-white text-[#2C1B57] shadow-xs' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {tab === 'audit' ? 'Audit Scan' : tab}
                  </button>
                ))}
              </div>
            </div>

            {activePreviewTab === 'pipeline' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: '124', label: 'Verified Talent' },
                    { val: '37', label: 'Shortlisted' },
                    { val: '9', label: 'Interviews' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <div className="text-2xl font-extrabold text-white">{s.val}</div>
                      <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(3,minmax(165px,1fr))] sm:grid-cols-3 gap-2.5 text-xs overflow-x-auto pb-2">
                  {[
                    {
                      title: 'APPLIED (18)',
                      cards: [
                        { name: 'Maya Chen', role: 'Senior Product Designer', status: 'ID Verified', score: '94%' },
                        { name: 'Arjun Rao', role: 'Staff Distributed Eng.', status: 'Cleared', score: '91%' },
                      ],
                    },
                    {
                      title: 'SCREENING (7)',
                      cards: [{ name: 'Leo Fischer', role: 'Growth Lead (SaaS)', status: 'Cleared', score: '89%', ring: true }],
                    },
                    {
                      title: 'INTERVIEW (9)',
                      cards: [{ name: 'Priya Nair', role: 'Senior Data Analyst', status: 'Thu 2:30 PM', score: '96%', isTime: true }],
                    },
                  ].map((col) => (
                    <div key={col.title} className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-2">
                      <div className="text-[10px] font-extrabold text-white/40 tracking-wider">{col.title}</div>
                      {col.cards.map((card) => (
                        <div key={card.name} className={`bg-white text-[#2C1B57] p-2.5 rounded-xl shadow-xs ${card.ring ? 'ring-2 ring-[#B29CFE]' : ''}`}>
                          <div className="font-extrabold text-[11px]">{card.name}</div>
                          <div className="text-[9px] text-[#6F687A]">{card.role}</div>
                          <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-[#E8E3EF]">
                            <span className={`font-bold flex items-center gap-0.5 ${card.isTime ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {card.isTime ? <Clock className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />} {card.status}
                            </span>
                            <span className="font-extrabold text-[#42326E]">{card.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreviewTab === 'audit' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                    <div>
                      <div className="font-extrabold text-sm text-white">Priya Nair - Credential Dossier</div>
                      <div className="text-xs text-white/70">Authenticated via Indian UIDAI and EPFO Registries</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">100% Passed</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { title: 'Government ID', desc: 'Aadhaar verified via OTP' },
                    { title: 'Phone Authentication', desc: 'Carrier active 5+ years' },
                    { title: 'Work History & Tenure', desc: 'EPFO payroll validated' },
                    { title: 'Degree Accreditation', desc: 'B.Tech IIT Bombay (2020)' },
                  ].map((item) => (
                    <div key={item.title} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-white/60">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreviewTab === 'velocity' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="text-xs text-white/60 uppercase font-semibold">Median Time-to-Offer</div>
                    <div className="text-3xl font-extrabold text-white mt-1">18 Days</div>
                    <div className="text-[11px] text-emerald-400 mt-2 font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> 4.2 days faster</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="text-xs text-white/60 uppercase font-semibold">Offer Close Rate</div>
                    <div className="text-3xl font-extrabold text-white mt-1">88.2%</div>
                    <div className="text-[11px] text-emerald-400 mt-2 font-bold">18 offers signed</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Verification Accuracy</span>
                    <span className="font-extrabold text-emerald-300">94.6%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-[#7CE0B0] h-full rounded-full" style={{ width: '94.6%' }} />
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => onNavigate('dashboard')} className="mt-5 w-full py-3 bg-gradient-to-r from-[#42326E] via-[#5A4590] to-[#795EB5] border border-white/20 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 hover:opacity-95 shadow-md transition-all">
              <span>Launch Recruiter Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute -top-4 -left-6 apple-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-float-slow hidden sm:flex border border-white/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <div className="text-xs font-bold text-[#2C1B57]">Identity Verified</div>
              <div className="text-[10px] text-[#6F687A]">UIDAI & Employment Registry</div>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-6 apple-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-float-delayed hidden sm:flex border border-white/80">
            <div className="w-10 h-10 rounded-xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <div className="text-xs font-bold text-[#2C1B57]">+18.4% Applicants</div>
              <div className="text-[10px] text-[#6F687A]">Verified candidate cohort</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SOCIAL PROOF STRIP                          */}
      {/* ═══════════════════════════════════════════ */}
      <section className="border-y border-[#E8E3EF] bg-white/85 py-8">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 flex flex-col md:flex-row md:items-center gap-5 md:gap-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F687A] shrink-0">Made for teams building what comes next</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-[#5B526E]">
            <span>Startups</span><span>Talent teams</span><span>Engineering leaders</span><span>Growing enterprises</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STORY SECTION                               */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-story py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
          <div className="max-w-lg">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-[#2C1B57]">Hiring should not begin with doubt.</h2>
            <p className="mt-6 text-base sm:text-lg text-[#49454F] leading-relaxed">When each candidate comes with clear signals, your team can spend less time checking claims and more time meeting people.</p>
            <button onClick={() => onNavigate('candidates')} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#42326E] hover:gap-3 transition-all">
              See the talent directory <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="landing-story-board rounded-[2rem] border border-[#DCD4E8] bg-white p-5 sm:p-8 shadow-[0_28px_70px_-42px_rgba(44,27,87,.4)]">
            <div className="flex items-center justify-between border-b border-[#E8E3EF] pb-5 mb-5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F687A]">From uncertainty to clarity</span>
              <ShieldCheck className="h-5 w-5 text-[#5F8A72]" />
            </div>
            {[
              ['Unverified resumes', 'Credential evidence', 'Identity, work history and education in view'],
              ['Slow screening', 'Qualified shortlists', 'Relevant skills and fit at a glance'],
              ['Endless scheduling', 'Interview momentum', 'One pipeline from shortlist to meeting'],
            ].map(([before, after, detail]) => (
              <div key={before} className="grid grid-cols-[1fr_auto_1.2fr] items-center gap-3 sm:gap-5 py-4 border-b last:border-b-0 border-[#EFEAF6]">
                <span className="text-xs sm:text-sm text-[#8B8394] line-through decoration-[#C9BCCF]">{before}</span>
                <ArrowRight className="h-4 w-4 text-[#B29CFE]" />
                <span>
                  <strong className="block text-xs sm:text-sm text-[#2C1B57]">{after}</strong>
                  <span className="mt-0.5 hidden sm:block text-xs text-[#6F687A]">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SHOWCASE SECTION                            */}
      {/* ═══════════════════════════════════════════ */}
      <section id="showcase" className="landing-showcase py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 w-full bg-[#281A4F] text-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl mb-12 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-[-0.04em] leading-[1.1]">The whole hiring picture, in focus.</h2>
            <p className="text-base sm:text-lg text-[#D9D0EC] leading-relaxed">Explore the signals and tools that bring better decisions into one workspace.</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 landing-tabs" role="tablist">
            {showcaseItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveShowcaseTab(idx)}
                  role="tab"
                  aria-selected={activeShowcaseTab === idx}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap border ${
                    activeShowcaseTab === idx ? 'bg-white text-[#2C1B57] border-white shadow-md' : 'bg-white/5 text-[#E0D4FC] border-white/15 hover:border-[#B29CFE] hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          <div key={activeShowcaseTab} role="tabpanel" className="landing-feature-panel bg-[#FCFCF7] rounded-[2rem] p-6 sm:p-10 lg:p-12 border border-white/20 shadow-[0_30px_90px_-35px_rgba(0,0,0,.5)] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-[#29233A]">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-extrabold px-3 py-1 bg-[#EDE6FA] text-[#42326E] rounded-full inline-block">{showcaseItems[activeShowcaseTab].badge}</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57]">{showcaseItems[activeShowcaseTab].title}</h3>
              <p className="text-sm font-semibold text-[#42326E]">{showcaseItems[activeShowcaseTab].subtitle}</p>
              <p className="text-sm text-[#49454F] leading-relaxed">{showcaseItems[activeShowcaseTab].description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-[#E8E3EF]">
                {showcaseItems[activeShowcaseTab].metrics.map((m, i) => (
                  <div key={i} className="py-2 pr-2">
                    <div className="text-[10px] text-[#6F687A] font-semibold">{m.label}</div>
                    <div className="text-sm font-extrabold text-[#2C1B57] mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate('dashboard')} className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5">
                <span>Experience in Recruiter Portal</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="lg:col-span-6 bg-[#2C1B57] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-[0_20px_40px_-20px_rgba(44,27,87,.5)] min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-xs font-bold text-white/70">{showcaseItems[activeShowcaseTab].subtitle}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-3">
                {showcaseItems[activeShowcaseTab].metrics.map((metric, index) => (
                  <div key={metric.label} className="p-4 bg-white/[.08] rounded-xl border border-white/10 flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B29CFE]/20 text-[#E0D4FC] text-xs font-bold">0{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-[#C9BEE3]">{metric.label}</span>
                      <strong className="block text-sm text-white">{metric.value}</strong>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-[#7CE0B0] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PLATFORM FEATURES BENTO                     */}
      {/* ═══════════════════════════════════════════ */}
      <section id="platform" className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="max-w-3xl mb-14 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">One workspace. Every decision in view.</h2>
          <p className="text-base text-[#49454F] leading-relaxed">Smile Jobs replaces fragmented spreadsheets, unverified resumes, and disjointed calendars with one high-precision platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="md:col-span-2 lg:col-span-1 bg-[#2C1B57] text-white p-7 sm:p-8 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden group apple-card-hover border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#B29CFE]/20 to-transparent blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6"><ShieldCheck className="w-6 h-6 text-[#7CE0B0]" /></div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Verified Profiles</h3>
              <p className="text-sm text-white/70 leading-relaxed font-normal">Every candidate shows exactly what has been authenticated — government ID, corporate work email, salary tenure, and accredited degrees.</p>
            </div>
            <div className="mt-8 rounded-2xl bg-white/10 border border-white/10 p-4 space-y-3">
              {['Identity check', 'Phone verified', 'Work history', 'Degree match'].map((item) => (
                <div key={item} className="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span>{item}</span><CheckCircle2 className="w-4 h-4 text-[#7CE0B0]" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mb-6"><Search className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Smart Candidate Search</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Filter by competency, verified experience, location, and availability.</p>
            </div>
            <div className="mt-6 rounded-2xl border border-[#E8E3EF] bg-[#FCFCF7] p-3 flex items-center gap-2 text-xs font-medium text-[#6F687A]"><Search className="w-4 h-4" /> Search skills, role or location</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['React', '5+ years', 'Remote'].map((t) => (
                <span key={t} className="text-[11px] font-bold text-[#42326E] bg-[#EDE6FA] px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
            <button onClick={() => onNavigate('candidates')} className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start">
              Browse directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6"><Zap className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Drag & Drop Pipeline</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Move talent across 6 stages with instant notifications.</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px] font-bold text-[#6F687A]">
              {['Applied', 'Shortlisted', 'Interview'].map((stage, i) => (
                <div key={stage} className="rounded-xl bg-[#F7F4FA] border border-[#E8E3EF] p-2">
                  <span className="block mb-2">{stage}</span>
                  <span className="block h-9 rounded-lg bg-white border border-[#E8E3EF] px-1.5 py-2 text-[#42326E] truncate">{['Maya C.', 'Leo F.', 'Priya N.'][i]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('dashboard')} className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start">
              View pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6"><Briefcase className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Guided Job Posting</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Create transparent listings in under 5 minutes.</p>
            </div>
            <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-[#6F687A]">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <span key={step} className={`flex h-7 w-7 items-center justify-center rounded-full border ${step < 4 ? 'border-[#42326E] bg-[#42326E] text-white' : 'border-[#DAD1E8] bg-white'}`}>{step}</span>
              ))}
            </div>
            <button onClick={() => onNavigate('post-job')} className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start">
              Create listing <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="md:col-span-2 bg-white p-7 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mb-6"><BarChart3 className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Recruitment Metrics</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Track time-to-hire, conversion rates, and benchmarks.</p>
            </div>
            <div className="mt-6 flex items-end gap-2 h-20" aria-hidden="true">
              {[35, 52, 45, 66, 54, 72, 83, 69, 91, 78, 100, 88].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#42326E] to-[#B29CFE] opacity-75" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="pt-6 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#EFEAF6] mt-4">
              {[
                { val: '18 Days', label: 'Avg. Time-to-Offer' },
                { val: '88.2%', label: 'Offer Acceptance' },
                { val: '0%', label: 'Credential Fraud' },
              ].map((m) => (
                <div key={m.label} className="bg-[#FCFCF7] p-2 sm:p-3 rounded-2xl border border-[#E8E3EF]">
                  <div className="text-xl font-extrabold text-[#2C1B57]">{m.val}</div>
                  <div className="text-xs text-[#6F687A]">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TALENT PREVIEW                              */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 bg-[#F5F1FA] border-y border-[#E8E3EF]">
        <div className="max-w-[1440px] mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C1B57] tracking-tight">Talent worth a closer look.</h2>
              <p className="text-sm text-[#49454F] mt-1">{authUser ? 'Explore candidates in your workspace.' : 'Preview profiles. Sign in for full access.'}</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-white rounded-xl border border-[#E8E3EF]">
              {(['all', 'Design', 'Engineering', 'Analytics', 'Product'] as const).map((dept) => (
                <button key={dept} onClick={() => setTalentRoleFilter(dept)} className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${talentRoleFilter === dept ? 'bg-[#2C1B57] text-white shadow-xs' : 'text-[#49454F] hover:bg-gray-100'}`}>
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTalent.slice(0, 3).map((candidate) => {
              const isPremium = candidate.matchScore >= 90;
              return (
                <button key={candidate.id} onClick={() => onSelectCandidate(candidate)} className={`relative bg-white p-6 sm:p-7 rounded-3xl shadow-xs transition-all text-left flex flex-col justify-between overflow-hidden group ${isPremium ? 'border-2 border-amber-300 hover:shadow-lg' : 'border border-[#E8E3EF] hover:border-[#B29CFE]'}`}>
                  {isPremium && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-300" />}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0" style={{ backgroundColor: candidate.avatarBg }}>
                          {getInitials(candidate.name)}
                        </div>
                        <div>
                          <div className="font-extrabold text-base text-[#2C1B57] group-hover:text-[#42326E] transition-colors flex items-center gap-1.5">
                            {candidate.name}<ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-xs text-[#6F687A]">{candidate.role}</div>
                        </div>
                      </div>
                      {isPremium ? (
                        <div className="flex flex-col items-end shrink-0 pl-2">
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs whitespace-nowrap mb-1"><Sparkles className="w-3 h-3 text-amber-500" /> Top Match</span>
                          <strong className="text-2xl leading-none font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 tabular-nums">{candidate.matchScore}%</strong>
                        </div>
                      ) : (
                        <span className="text-right shrink-0 pl-2"><strong className="block text-2xl leading-none font-extrabold text-[#42326E] tabular-nums">{candidate.matchScore}%</strong><span className="text-[10px] font-bold text-[#6F687A]">match</span></span>
                      )}
                    </div>
                    <p className="text-xs text-[#49454F] line-clamp-2 mb-4 leading-relaxed">{candidate.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {candidate.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[11px] font-semibold px-2 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-md text-[#49454F]">{s}</span>
                      ))}
                      {candidate.skills.length > 3 && <span className="text-[11px] font-semibold text-[#6F687A] px-1 py-0.5">+{candidate.skills.length - 3}</span>}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#EFEAF6] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#6F687A] flex items-center gap-1 font-medium"><MapPin className="w-3.5 h-3.5 text-[#42326E]" /> {candidate.location}</span>
                    <span className="font-extrabold text-[#C58A3A]">{candidate.salaryExpected} exp.</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#42326E] group-hover:gap-2.5 transition-all">View profile <ArrowRight className="h-3.5 w-3.5" /></span>
                </button>
              );
            })}
          </div>

          {displayTalent.length === 0 && (
            <div className="rounded-3xl border border-[#DAD1E8] bg-white p-8 sm:p-12 text-center">
              <Search className="h-7 w-7 text-[#7359B4] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#2C1B57]">No profiles in this view yet</h3>
              <button onClick={() => setTalentRoleFilter('all')} className="mt-5 text-sm font-bold text-[#42326E] underline underline-offset-4">Show all</button>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button onClick={() => onNavigate('candidates')} className="px-6 py-3 bg-white border border-[#E8E3EF] hover:border-[#B29CFE] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all flex items-center gap-2">
              <span>Explore all candidates</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* COMPARISON TABLE                            */}
      {/* ═══════════════════════════════════════════ */}
      <section id="comparison" className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">A clearer way to move forward.</h2>
          <p className="text-base text-[#49454F]">The old way wastes hours on unverified claims and scheduling gymnastics.</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#E8E3EF] shadow-lg overflow-hidden max-w-5xl mx-auto">
          <div className="hidden sm:grid grid-cols-12 bg-[#FCFCF7] border-b border-[#E8E3EF] py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#6F687A]">
            <div className="col-span-4">Capability</div>
            <div className="col-span-4 text-gray-500">Traditional</div>
            <div className="col-span-4 font-extrabold text-[#2C1B57]">Smile Jobs</div>
          </div>
          <div className="divide-y divide-[#EFEAF6] text-xs">
            {[
              { feature: 'Candidate Verification', traditional: 'Self-reported (High fraud)', smileJobs: 'Gov ID, EPFO & Degree Audited' },
              { feature: 'Time to Shortlist', traditional: '14-21 Days', smileJobs: 'Under 48 Hours' },
              { feature: 'Credential Reliability', traditional: '12-18% falsified', smileJobs: '0% falsification tolerance' },
              { feature: 'Interview Scheduling', traditional: '5-10 email exchanges', smileJobs: '1-click Cal/Zoom booking' },
              { feature: 'Cost per Hire', traditional: '₹45K-90K (15% markup)', smileJobs: '₹2,499/mo flat subscription' },
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-0 py-5 px-5 sm:px-6 items-center hover:bg-[#FCFCF7]/70 transition-colors">
                <div className="sm:col-span-4 font-bold text-[#2C1B57] text-sm sm:text-xs">{row.feature}</div>
                <div className="sm:col-span-4 text-[#6F687A] flex items-start gap-1.5"><X className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span>{row.traditional}</span></div>
                <div className="sm:col-span-4 font-bold text-emerald-800 flex items-start gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>{row.smileJobs}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HIRING STEPS                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-white border-y border-[#E8E3EF] py-24 sm:py-28 px-5 sm:px-10 lg:px-14 xl:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-12">
            <h2 className="max-w-xl text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-[#2C1B57] leading-[1.1]">From open role to open conversation.</h2>
            <p className="max-w-sm text-sm sm:text-base text-[#49454F]">A straightforward path through the moments that matter.</p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 border-t border-[#DAD1E8]">
            {['Post a role', 'Get verified matches', 'Shortlist candidates', 'Schedule interviews', 'Hire with confidence'].map((step, index) => (
              <li key={step} className="relative border-b lg:border-b-0 border-[#E8E3EF] py-6 lg:pr-5 lg:border-r last:border-r-0 lg:pl-5 first:pl-0">
                <span className="text-xs font-bold text-[#7359B4] tabular-nums">0{index + 1}</span>
                <h3 className="mt-3 text-base font-bold text-[#2C1B57]">{step}</h3>
                {index < 4 && <ArrowRight className="hidden lg:block absolute top-6 right-4 h-4 w-4 text-[#B29CFE]" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICING - RAZORPAY COMPLIANCE               */}
      {/* ═══════════════════════════════════════════ */}
      <section id="pricing" className="py-24 sm:py-28 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-block text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200"><CreditCard className="w-3 h-3 inline mr-1" />Secure Payments via Razorpay</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">Transparent pricing. No hidden fees.</h2>
          <p className="text-base text-[#49454F]">All prices in Indian Rupees (INR), inclusive of 18% GST.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: 'Starter',
              desc: 'For small teams',
              price: '₹2,499',
              period: '/month',
              features: ['5 active job postings', '50 verified contacts', 'Basic pipeline', 'Email support'],
              featured: false,
            },
            {
              name: 'Professional',
              desc: 'For growing teams',
              price: '₹7,499',
              period: '/month',
              features: ['25 active job postings', '250 verified contacts', 'Advanced analytics', 'Priority support', 'Interview scheduling'],
              featured: true,
            },
            {
              name: 'Enterprise',
              desc: 'Custom solutions',
              price: 'Custom',
              period: '',
              features: ['Unlimited postings', 'Unlimited contacts', 'Custom integrations', 'Dedicated manager', '24/7 support'],
              featured: false,
            },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-3xl p-8 flex flex-col relative ${plan.featured ? 'bg-[#2C1B57] text-white border-2 border-[#B29CFE] shadow-xl' : 'bg-white border border-[#E8E3EF] shadow-sm'}`}>
              {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-3 py-1 bg-[#B29CFE] text-[#2C1B57] rounded-full uppercase tracking-wider">Most Popular</span>}
              <div className="mb-6">
                <h3 className={`text-lg font-extrabold ${plan.featured ? '' : 'text-[#2C1B57]'}`}>{plan.name}</h3>
                <p className={`text-xs mt-1 ${plan.featured ? 'text-white/70' : 'text-[#6F687A]'}`}>{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className={`text-4xl font-extrabold ${plan.featured ? '' : 'text-[#2C1B57]'}`}>{plan.price}</span>
                <span className={`text-sm ${plan.featured ? 'text-white/70' : 'text-[#6F687A]'}`}>{plan.period}</span>
              </div>
              <ul className={`space-y-3 text-sm mb-8 flex-1 ${plan.featured ? 'text-white/90' : 'text-[#49454F]'}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? 'text-[#7CE0B0]' : 'text-emerald-600'}`} /> {f}</li>
                ))}
              </ul>
              <button
                onClick={() => plan.price === 'Custom' ? openPolicy('contact') : onNavigate('post-job')}
                className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${plan.featured ? 'bg-white text-[#2C1B57] hover:bg-[#FCFCF7]' : 'bg-[#FCFCF7] border border-[#E8E3EF] hover:border-[#42326E] text-[#2C1B57]'}`}
              >
                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#6F687A]">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> SSL Secured</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Razorpay PCI-DSS</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> GST Invoicing</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#6F687A]">
            {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking', 'Wallets'].map((m) => (
              <span key={m} className="px-3 py-1.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-lg">{m}</span>
            ))}
          </div>
          <p className="text-xs text-[#6F687A] text-center">
            View our <button onClick={() => openPolicy('refund')} className="text-[#42326E] font-bold underline underline-offset-2 hover:text-[#2C1B57]">Refund Policy</button> for cancellation and refund details.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL CTA                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="pb-24 px-6 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="bg-[#2C1B57] rounded-3xl p-10 sm:p-14 lg:p-16 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/10">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B29CFE]">Make your next move count</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">Your next great hire may already be verified.</h2>
            <p className="text-base text-white/70 leading-relaxed font-normal">Bring your roles, talent, and hiring decisions together.</p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3.5 shrink-0">
            <button onClick={() => onNavigate('post-job')} className="px-8 py-4 bg-white text-[#2C1B57] hover:bg-[#FCFCF7] text-sm font-extrabold rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
              <span>Post a Job Free</span><ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('candidates')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-extrabold rounded-2xl transition-all">
              Explore Talent
            </button>
          </div>
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-radial from-[#B29CFE]/30 to-transparent blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER — RAZORPAY COMPLIANT                 */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-[#E8E3EF] bg-white pt-16 pb-8 px-5 sm:px-10 lg:px-14 xl:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-9 pb-14">
            <div className="col-span-2 sm:col-span-4 lg:col-span-1">
              <span className="text-xl font-extrabold tracking-tight text-[#2C1B57] flex items-center gap-2.5">
                <AppLogo className="w-7 h-7 rounded-lg" /> Smile Jobs
              </span>
              <p className="mt-3 max-w-[25ch] text-sm leading-relaxed text-[#6F687A]">Verified hiring infrastructure for modern teams across India.</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#6F687A]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /><span>Secured by Razorpay</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Platform</h3>
              <a href="#showcase" className="block text-[#6F687A] hover:text-[#42326E]">Product tour</a>
              <button onClick={() => onNavigate('dashboard')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Recruiter console</button>
              <button onClick={() => onNavigate('post-job')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Post a job</button>
              <a href="#pricing" className="block text-[#6F687A] hover:text-[#42326E]">Pricing</a>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Talent</h3>
              <button onClick={() => onNavigate('candidates')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Browse candidates</button>
              <a href="#comparison" className="block text-[#6F687A] hover:text-[#42326E]">Why Smile Jobs</a>
              <button onClick={() => onNavigate(authUser ? 'profile' : 'login')} className="block text-[#6F687A] hover:text-[#42326E] text-left">
                {authUser ? 'My profile' : 'Sign in'}
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Legal</h3>
              <button onClick={() => openPolicy('privacy')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Privacy Policy</button>
              <button onClick={() => openPolicy('terms')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Terms & Conditions</button>
              <button onClick={() => openPolicy('refund')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Refund & Cancellation</button>
              <button onClick={() => openPolicy('shipping')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Shipping & Delivery</button>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Support</h3>
              <button onClick={() => openPolicy('contact')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Contact Us</button>
              <a href={`mailto:${BIZ.email}`} className="block text-[#6F687A] hover:text-[#42326E] break-all">{BIZ.email}</a>
              <a href={`mailto:${BIZ.supportEmail}`} className="block text-[#6F687A] hover:text-[#42326E]">{BIZ.supportEmail}</a>
              <a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="block text-[#6F687A] hover:text-[#42326E]">{BIZ.phone}</a>
            </div>
          </div>

          {/* Business Address Block - CRITICAL FOR RAZORPAY */}
          <div className="border-t border-[#E8E3EF] pt-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="flex items-start gap-3">
                <MapPinned className="w-5 h-5 text-[#42326E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#2C1B57] mb-1">Registered Business</p>
                  <p className="text-[#6F687A]">{BIZ.legalName}</p>
                  <p className="text-[#6F687A]">{BIZ.address.line1}</p>
                  <p className="text-[#6F687A]">{BIZ.address.line2}</p>
                  <p className="text-[#6F687A]">{BIZ.address.city} – {BIZ.address.pincode}</p>
                  <p className="text-[#6F687A]">{BIZ.address.state}, {BIZ.address.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#42326E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#2C1B57] mb-1">Email</p>
                  <p className="text-[#6F687A]">General: <a href={`mailto:${BIZ.email}`} className="hover:text-[#42326E] break-all">{BIZ.email}</a></p>
                  <p className="text-[#6F687A]">Support: <a href={`mailto:${BIZ.supportEmail}`} className="hover:text-[#42326E]">{BIZ.supportEmail}</a></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#42326E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#2C1B57] mb-1">Phone</p>
                  <p className="text-[#6F687A]"><a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="hover:text-[#42326E]">{BIZ.phone}</a></p>
                  <p className="text-[#6F687A] mt-1 text-[11px]">{BIZ.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-[#E8E3EF] pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#6F687A]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /><span className="font-semibold">We Accept:</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#6F687A]">
                {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking', 'Wallets'].map((m) => (
                  <span key={m} className="px-3 py-1.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-lg">{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright + Policy Links */}
          <div className="border-t border-[#E8E3EF] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6F687A]">
            <div className="text-center sm:text-left">
              <p>© 2026 Smile Jobs. All rights reserved.</p>
              <p className="mt-1">Operated by <strong className="text-[#2C1B57]">{BIZ.legalName}</strong> · {BIZ.type}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {[
                { key: 'privacy' as const, label: 'Privacy' },
                { key: 'terms' as const, label: 'Terms' },
                { key: 'refund' as const, label: 'Refunds' },
                { key: 'shipping' as const, label: 'Shipping' },
                { key: 'contact' as const, label: 'Contact' },
              ].map((link, i) => (
                <React.Fragment key={link.key}>
                  {i > 0 && <span className="text-[#DAD1E8]">·</span>}
                  <button onClick={() => openPolicy(link.key)} className="hover:text-[#42326E] font-medium">{link.label}</button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};