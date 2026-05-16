type StatusBannersProps = {
  error: string;
  success: string;
};

export const StatusBanners = ({ error, success }: StatusBannersProps) => {
  return (
    <>
      {error ? <div className="rounded-2xl border border-[#F28B82]/70 bg-[#FDECEA]/85 px-4 py-3 text-sm text-[#B3261E] shadow-sm backdrop-blur-md">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-[#81C995]/70 bg-[#E6F4EA]/85 px-4 py-3 text-sm text-[#137333] shadow-sm backdrop-blur-md">{success}</div> : null}
    </>
  );
};
