/** Stable IDs keep the open question intact across locale/theme changes. */
export const homeFaqs = [
  { id: 'guest-checkout', question: 'Do I need an account to place an order?', answer: 'FAQ guest checkout answer' },
  { id: 'gifting', question: 'Can I send flowers to someone else?', answer: 'FAQ gifting answer' },
  { id: 'delivery-schedule', question: 'Can I choose a delivery date and time slot?', answer: 'FAQ delivery schedule answer' },
  { id: 'delivery-area', question: 'How can I check whether delivery is available in my area?', answer: 'FAQ delivery area answer' },
  { id: 'card-message', question: 'Can I include a card and a personal message?', answer: 'FAQ card message answer' },
  { id: 'anonymous-sender', question: "Can I keep the sender's name anonymous?", answer: 'FAQ anonymous sender answer' },
  { id: 'payment', question: 'What payment methods does Lunarra currently accept?', answer: 'FAQ payment answer' },
  { id: 'order-tracking', question: 'How can I track my flower order?', answer: 'FAQ order tracking answer' },
] as const;
