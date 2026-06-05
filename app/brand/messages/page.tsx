import { redirect } from 'next/navigation';

type MessagesRedirectSearchParams = Promise<Record<string, string | string[] | undefined>>;

const buildMessagesHref = (searchParams: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/messages?${query}` : '/messages';
};

export default async function BrandMessagesPage({
  searchParams,
}: {
  searchParams: MessagesRedirectSearchParams;
}) {
  redirect(buildMessagesHref(await searchParams));
}
