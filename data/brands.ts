import type { Brand, City } from '@/types';

export const mockBrands: Brand[] = [
  {
    id: 'b1',
    userId: 'bu1',
    name: 'Noon Food KSA',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop',
    industry: 'Food Delivery',
    website: 'https://www.noon.com/food',
    city: 'Jeddah' as City,
    description: 'Premium food delivery platform connecting Saudi diners with top restaurants and cafes.',
    totalCampaigns: 156,
    activeOrders: 12,
  },
  {
    id: 'b2',
    userId: 'bu2',
    name: 'Noura Abaya House',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    industry: 'Fashion',
    website: 'https://nouraabayahouse.sa',
    city: 'Riyadh' as City,
    description: 'Contemporary abaya and modest fashion label with premium seasonal collections.',
    totalCampaigns: 89,
    activeOrders: 5,
  },
  {
    id: 'b3',
    userId: 'bu3',
    name: 'Oud Royale',
    logo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&h=100&fit=crop',
    industry: 'Perfumes & Oud',
    website: 'https://oudroyale.sa',
    city: 'Khobar' as City,
    description: 'Luxury oud and fragrance house focused on premium GCC scent experiences.',
    totalCampaigns: 234,
    activeOrders: 18,
  },
  {
    id: 'b4',
    userId: 'bu4',
    name: 'Desert Drive Auto',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop',
    industry: 'Automotive',
    website: 'https://desertdrive.sa',
    city: 'Dammam' as City,
    description: 'Automotive lifestyle brand for accessories, detailing, and road trip campaigns.',
    totalCampaigns: 178,
    activeOrders: 8,
  },
  {
    id: 'b5',
    userId: 'bu5',
    name: 'Hijaz Retreats',
    logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&h=100&fit=crop',
    industry: 'Hospitality',
    website: 'https://hijazretreats.sa',
    city: 'Mecca' as City,
    description: 'Hospitality group offering premium stays and Umrah-season guest experiences.',
    totalCampaigns: 67,
    activeOrders: 3,
  },
];

export const getBrandById = (brandId: string): Brand | undefined => {
  return mockBrands.find((brand) => brand.id === brandId);
};
