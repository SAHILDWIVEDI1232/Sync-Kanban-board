
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Members() {
  const navigate = useNavigate();
  const location = useLocation();

  const organization = location.state?.organization;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization?._id) {
      setLoading(false);
      return;
    }

    api.get(`/memberships/organization/${organization._id}`)
      .then(res => {
        setMembers(res.data.memberships || []);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, [organization]);

  if (!organization) {
    return (
      <div style={{ padding: 25 }}>
        <h2>Select an organization first.</h2>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 25 }}>
      <button onClick={() => navigate("/dashboard")}>Back</button>

      <h2>Members - {organization.name}</h2>

      {loading && <p>Loading...</p>}

      {!loading && members.length === 0 && <p>No members found.</p>}

      {members.map(member => (
        <div key={member._id} style={{
          padding: 15,
          margin: 10,
          border: "1px solid #ddd",
          borderRadius: 8
        }}>
          <h3>{member.userId?.name}</h3>
          <p>{member.userId?.email}</p>
          <p>Role: {member.role}</p>
          <p>Status: {member.status}</p>
          <p>Branch: {member.tenantId?.name || "Organization"}</p>
        </div>
      ))}
    </div>
  );
}

export default Members;
