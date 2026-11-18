
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Organizations() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/organizations")
      .then(res => {
        setOrganizations(res.data.organizations || res.data.data || []);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 25 }}>
      <button onClick={() => navigate("/dashboard")}>Back</button>

      <h2>Organizations</h2>

      {loading && <p>Loading...</p>}

      {organizations.map(org => (
        <div key={org._id} style={{
          padding: 15,
          margin: 10,
          border: "1px solid #ddd",
          borderRadius: 8
        }}>
          <h3>{org.name}</h3>
          <p>{org.description}</p>

          <button onClick={() => navigate("/tenants", {
            state: { organization: org }
          })}>
            Manage Branches
          </button>
        </div>
      ))}
    </div>
  );
}

export default Organizations;
