type FooterLink = { label: string; href?: string };

// Only published destinations have a URL; the rest open a coming-soon notice.
export const customerCareLinks: FooterLink[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us' },
  { label: 'Shipping Policy' },
  { label: 'Frequently Asked Questions' },
  { label: 'Payment Methods' },
  { label: 'Privacy Policy' },
  { label: 'Refund Policy' },
  { label: 'Complaint Resolution' },
  { label: 'Why Choose Lurana.vn' },
  { label: 'Blog' },
];

export const socialLinks: FooterLink[] = [
  { label: 'Facebook' },
  { label: 'Twitter' },
  { label: 'Instagram' },
  { label: 'Linkedin' },
  { label: 'Youtube' },
];

export const storeLocations = [
  // Editable labels, addresses and map URLs live in EN/VI common.json.
  { id: 'main', label: 'Main Store', addressKey: 'Main Store address', mapUrlKey: 'Main Store map URL' },
  { id: 'hcmc', label: 'HCMC Store', addressKey: 'HCMC Store address', mapUrlKey: 'HCMC Store map URL' },
  { id: 'hanoi', label: 'Hanoi Branch', addressKey: 'Hanoi Branch address', mapUrlKey: 'Hanoi Branch map URL' },
];
