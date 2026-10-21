type FooterLink = { label: string; href?: string };
export const storefrontContactPath = '/#contact';

// Only published destinations have a URL; the rest open a coming-soon notice.
export const customerCareLinks: FooterLink[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: storefrontContactPath },
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

export const storeLocations: { id: string; label: string; address: string; mapUrl: string }[] = [
  // Owner fills verified addresses here; blank entries stay hidden in Footer and About.
  { id: 'main', label: 'Main Store', address: '', mapUrl: '' },
  { id: 'hcmc', label: 'HCMC Store', address: '', mapUrl: '' },
  { id: 'hanoi', label: 'Hanoi Branch', address: '', mapUrl: '' },
];
