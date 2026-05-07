import type { Review } from '@/types';
import { mockBrands } from './brands';

export const mockReviews: Review[] = [
  {
    id: 'r1',
    creatorId: '1',
    brandId: 'b1',
    brand: mockBrands[0],
    orderId: 'o1',
    rating: 5,
    comment: 'Ali delivered exceptional content! The food reel he created for our restaurant went viral and brought in so many new customers. Highly professional and creative.',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'r2',
    creatorId: '1',
    brandId: 'b3',
    brand: mockBrands[2],
    orderId: 'o2',
    rating: 5,
    comment: 'Working with Ali was a great experience. He understood our brand perfectly and created content that resonated with our target audience. Will definitely work again!',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'r3',
    creatorId: '1',
    brandId: 'b2',
    brand: mockBrands[1],
    orderId: 'o3',
    rating: 4,
    comment: 'Great content quality and timely delivery. The engagement on the posts was impressive. Minor revisions needed but overall very satisfied.',
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 'r4',
    creatorId: '2',
    brandId: 'b2',
    brand: mockBrands[1],
    orderId: 'o4',
    rating: 5,
    comment: 'Sara is absolutely amazing! Her fashion content is top-notch and she has a genuine connection with her audience. Our collection sold out within days of her feature.',
    createdAt: new Date('2024-01-28'),
  },
  {
    id: 'r5',
    creatorId: '2',
    brandId: 'b5',
    brand: mockBrands[4],
    orderId: 'o5',
    rating: 5,
    comment: 'Professional, creative, and reliable. Sara\'s content perfectly showcased our new collection. The aesthetic quality exceeded our expectations.',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'r6',
    creatorId: '3',
    brandId: 'b4',
    brand: mockBrands[3],
    orderId: 'o6',
    rating: 5,
    comment: 'Hassan\'s tech reviews are incredibly detailed and trustworthy. His audience trusts his recommendations, which translated to great results for our product launch.',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'r7',
    creatorId: '4',
    brandId: 'b3',
    brand: mockBrands[2],
    orderId: 'o7',
    rating: 5,
    comment: 'Ayesha is a true professional! Her fitness content inspired so many people to try our products. The engagement was phenomenal.',
    createdAt: new Date('2024-02-28'),
  },
  {
    id: 'r8',
    creatorId: '6',
    brandId: 'b1',
    brand: mockBrands[0],
    orderId: 'o8',
    rating: 5,
    comment: 'Fatima\'s cooking videos are mouthwatering! She integrated our product so naturally into her recipes. Great ROI on this campaign.',
    createdAt: new Date('2024-03-01'),
  },
];

export const reviews = mockReviews;

export const getReviewsByCreatorId = (creatorId: string): Review[] => {
  return mockReviews.filter((review) => review.creatorId === creatorId);
};
