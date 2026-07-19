interface GroupCardProps {
  groupName: string;
  members: string[];
}

export default function GroupCard({ groupName, members }: GroupCardProps) {
  return (
    <div className="rounded-2xl border border-green-800/20 bg-[#0a1410] p-5">
      <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-green-300">
        Group {groupName}
      </h4>
      <ul className="mt-3 space-y-2 text-sm text-[#dff5d6]">
        {members.map((member) => (
          <li
            key={member}
            className="rounded-lg border border-green-800/20 px-3 py-2"
          >
            {member}
          </li>
        ))}
      </ul>
    </div>
  );
}
