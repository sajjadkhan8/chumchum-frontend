import type { Brand, City } from '@/types';

export const mockBrands: Brand[] = [
  {
    id: 'b1',
    userId: 'bu1',
    name: 'FoodPanda Pakistan',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop',
    industry: 'Food Delivery',
    website: 'https://foodpanda.pk',
    city: 'Karachi' as City,
    description: 'Pakistan\'s leading food delivery platform connecting customers with their favorite restaurants.',
    totalCampaigns: 156,
    activeOrders: 12,
  },
  {
    id: 'b2',
    userId: 'bu2',
    name: 'Khaadi',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    industry: 'Fashion',
    website: 'https://khaadi.com',
    city: 'Lahore' as City,
    description: 'Premium Pakistani fashion brand known for traditional and contemporary designs.',
    totalCampaigns: 89,
    activeOrders: 5,
  },
  {
    id: 'b3',
    userId: 'bu3',
    name: 'Daraz Pakistan',
    logo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&h=100&fit=crop',
    industry: 'E-commerce',
    website: 'https://daraz.pk',
    city: 'Lahore' as City,
    description: 'Pakistan\'s largest online shopping platform with millions of products.',
    totalCampaigns: 234,
    activeOrders: 18,
  },
  {
    id: 'b4',
    userId: 'bu4',
    name: 'Jazz',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop',
    industry: 'Telecom',
    website: 'https://jazz.com.pk',
    city: 'Islamabad' as City,
    description: 'Pakistan\'s leading digital communications company.',
    totalCampaigns: 178,
    activeOrders: 8,
  },
  {
    id: 'b5',
    userId: 'bu5',
    name: 'Gul Ahmed',
    logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&h=100&fit=crop',
    industry: 'Fashion',
    website: 'https://gulahmedshop.com',
    city: 'Karachi' as City,
    description: 'Iconic Pakistani textile brand with a legacy of quality and style.',
    totalCampaigns: 67,
    activeOrders: 3,
  },
];

export const getBrandById = (brandId: string): Brand | undefined => {
  return mockBrands.find((brand) => brand.id === brandId);
};
