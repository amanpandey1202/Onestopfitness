import { Spinner } from "@/components/admin/ui";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="label-kicker">Loading admin console</p>
      </div>
    </div>
  );
}