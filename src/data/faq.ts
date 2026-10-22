export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** Тільки підтверджені власницею відповіді. Поки FAQ прихований. */
export const faq: FaqItem[] = [];
