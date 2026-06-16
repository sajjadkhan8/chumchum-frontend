import { redirect } from 'next/navigation';

export default function AmbassadorsRedirect() {
  redirect('/brand/explore?view=ambassadors');
}
