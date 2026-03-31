import { ActivityRecord } from "../api/cases";

interface Props {
  caseNumber: string;
  activities: ActivityRecord[];
  loading: boolean;
}

export function CaseDetail({ caseNumber, activities, loading }: Props) {
  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Case #{caseNumber} — Activity Timeline</h2>
      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : activities.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No activities recorded for this case.</p>
      ) : (
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Case Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => (
              <tr key={i}>
                <td>{a.date}</td>
                <td>{a.case_type}</td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
