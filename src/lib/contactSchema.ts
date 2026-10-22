import { z } from 'zod'
import { categories } from '../data/categories'
import { content } from '../data/content'
import { giftCertificates } from '../data/giftCertificates'
import { services } from '../data/services'

const messages = content.form.validation
export const contactServiceCategories = categories
  .filter(category => services.some(service => service.isPublished && service.categoryId === category.id))
  .sort((a, b) => a.order - b.order)

export const contactSchema = z.object({
  name: z.string().trim().min(2, messages.name).max(100, messages.name),
  email: z.string().trim().max(254, messages.email).pipe(z.email(messages.email)),
  phone: z.string().trim().max(30, messages.phone).refine(value => {
    if (!value) return true
    const digits = value.replace(/\D/g, '').length
    return /^\+?[\d\s().-]+$/.test(value) && digits >= 7 && digits <= 15
  }, messages.phone).optional(),
  serviceId: z.string().refine(value => !value || (giftCertificates.enabled && value === giftCertificates.contactFormTopic) || contactServiceCategories.some(category => category.id === value), messages.service).default(''),
  message: z.string().trim().min(2, messages.message).max(2000, messages.message),
})
export const contactSubmissionSchema = contactSchema.extend({
  turnstileToken: z.string().trim().min(1, messages.token).max(2048, messages.token),
  submissionId: z.uuid(),
  website: z.string().max(200).default(''),
})
export type ContactInput = z.infer<typeof contactSchema>

