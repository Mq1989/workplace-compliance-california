export const INDUSTRIES = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant / Food Service' },
  { value: 'construction', label: 'Construction' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' }
];

export const WORKPLACE_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail_store', label: 'Retail Store' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'outdoor', label: 'Outdoor / Field' },
  { value: 'multiple_locations', label: 'Multiple Locations' }
];

export const VIOLENCE_TYPES = [
  { value: 'type1', label: 'Type 1 - Criminal Intent (no legitimate business)', description: 'Violence by someone who enters to commit a crime (robbery, etc.)' },
  { value: 'type2', label: 'Type 2 - Customer/Client', description: 'Violence by customers, clients, patients, students, or visitors' },
  { value: 'type3', label: 'Type 3 - Worker-on-Worker', description: 'Violence by current or former employees, supervisors, or managers' },
  { value: 'type4', label: 'Type 4 - Personal Relationship', description: 'Violence by someone with personal relationship to an employee' }
];

export const INCIDENT_TYPES = [
  { value: 'physical_attack_no_weapon', label: 'Physical attack without weapon (biting, choking, kicking, etc.)' },
  { value: 'attack_with_weapon', label: 'Attack with weapon or object' },
  { value: 'threat_physical_force', label: 'Threat of physical force' },
  { value: 'threat_weapon', label: 'Threat of weapon use' },
  { value: 'sexual_assault', label: 'Sexual assault' },
  { value: 'sexual_threat', label: 'Sexual threat or unwanted contact' },
  { value: 'animal_attack', label: 'Animal attack' },
  { value: 'other', label: 'Other' }
];

export const PERPETRATOR_TYPES = [
  { value: 'client_customer', label: 'Client or Customer' },
  { value: 'family_friend_of_client', label: 'Family/Friend of Client' },
  { value: 'stranger_criminal_intent', label: 'Stranger with Criminal Intent' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'supervisor_manager', label: 'Supervisor or Manager' },
  { value: 'partner_spouse', label: 'Partner or Spouse' },
  { value: 'parent_relative', label: 'Parent or Relative' },
  { value: 'other', label: 'Other' }
];

export const ALERT_METHODS = [
  { value: 'alarm', label: 'Alarm System' },
  { value: 'pa', label: 'PA Announcement' },
  { value: 'text', label: 'Text Message' },
  { value: 'email', label: 'Email Alert' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'radio', label: 'Two-Way Radio' }
];

export const TRAINING_TOPICS = [
  'The employer\'s WVPP and how to obtain a copy',
  'How to participate in WVPP development and implementation',
  'How to report incidents without fear of reprisal',
  'Workplace violence hazards specific to job duties',
  'How to seek assistance to prevent or respond to violence',
  'Strategies to avoid physical harm',
  'The violent incident log',
  'How to obtain copies of records',
  'Emergency response procedures',
  'De-escalation techniques'
];

export const INDUSTRY_HAZARDS = {
  retail: [
    { type: 'type1', description: 'Robbery or theft attempt', riskLevel: 'high', controls: ['Cash handling procedures', 'Limited cash on premises', 'Surveillance cameras', 'Panic buttons'] },
    { type: 'type2', description: 'Angry or aggressive customers', riskLevel: 'medium', controls: ['De-escalation training', 'Manager intervention protocols', 'Security presence'] }
  ],
  restaurant: [
    { type: 'type1', description: 'Robbery attempt', riskLevel: 'medium', controls: ['Cash handling procedures', 'Surveillance', 'Well-lit premises'] },
    { type: 'type2', description: 'Intoxicated or difficult patrons', riskLevel: 'medium', controls: ['Alcohol service policies', 'De-escalation training', 'Security for evening hours'] },
    { type: 'type3', description: 'Kitchen staff conflicts', riskLevel: 'low', controls: ['Conflict resolution procedures', 'Supervisor training', 'Clear communication protocols'] }
  ],
  construction: [
    { type: 'type1', description: 'Site intrusion or theft', riskLevel: 'medium', controls: ['Site security', 'Perimeter fencing', 'Tool lockup procedures'] },
    { type: 'type3', description: 'Crew conflicts', riskLevel: 'medium', controls: ['Clear supervision', 'Communication protocols', 'Conflict resolution training'] }
  ],
  professional_services: [
    { type: 'type2', description: 'Upset clients or visitors', riskLevel: 'low', controls: ['Visitor sign-in procedures', 'Reception area security', 'Meeting room protocols'] },
    { type: 'type3', description: 'Workplace conflicts', riskLevel: 'low', controls: ['HR policies', 'Conflict resolution procedures', 'Manager training'] },
    { type: 'type4', description: 'Domestic situations affecting workplace', riskLevel: 'low', controls: ['Security awareness', 'Confidential reporting', 'Support resources'] }
  ],
  manufacturing: [
    { type: 'type1', description: 'Unauthorized access or theft', riskLevel: 'medium', controls: ['Access control systems', 'Security cameras', 'Visitor procedures'] },
    { type: 'type3', description: 'Worker conflicts', riskLevel: 'medium', controls: ['Supervisor presence', 'Clear reporting procedures', 'Employee assistance program'] }
  ],
  other: [
    { type: 'type2', description: 'Interactions with public', riskLevel: 'medium', controls: ['De-escalation training', 'Security protocols', 'Clear reporting procedures'] },
    { type: 'type3', description: 'Workplace conflicts', riskLevel: 'low', controls: ['HR policies', 'Management training', 'Open communication'] }
  ]
};

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free Trial',
    price: 0,
    features: ['14-day trial', 'All Professional features']
  },
  starter: {
    name: 'Starter',
    price: 29,
    features: ['1 location', 'Up to 25 employees', 'WVPP generation', 'Incident log', 'Email reminders']
  },
  professional: {
    name: 'Professional',
    price: 79,
    features: ['Up to 3 locations', 'Up to 100 employees', 'Training modules', 'Compliance dashboard', 'Priority support']
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited locations', 'Unlimited employees', 'API access', 'Custom branding', 'Dedicated support']
  }
};
