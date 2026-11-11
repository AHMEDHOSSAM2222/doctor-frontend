import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, CLINIC_NAME } from '../../api.js';
import { formatDate } from '../../format.js';

export default function PatientList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ patients: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `Patient files – ${CLINIC_NAME}`;
  }, []);

  // Wait until typing pauses before searching.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .listPatients({ search: query })
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const more = await api.listPatients({ search: query, offset: data.patients.length });
      setData((prev) => ({ patients: [...prev.patients, ...more.patients], total: more.total }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const noFilesYet = !loading && !query && data.total === 0 && !error;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Patient files</h1>
          {!noFilesYet && !loading && (
            <p className="muted">
              {query
                ? `${data.total} ${data.total === 1 ? 'file matches' : 'files match'} your search`
                : `${data.total} ${data.total === 1 ? 'file' : 'files'}`}
            </p>
          )}
        </div>
        <Link to="/admin/patients/new" className="btn btn-primary">
          New file
        </Link>
      </div>

      {noFilesYet ? (
        <div className="empty">
          <h2>No patient files yet</h2>
          <p className="muted">
            Create the first file, then print the QR code for your waiting room so patients can open their files from
            their phones.
          </p>
          <div className="button-row">
            <Link to="/admin/patients/new" className="btn btn-primary">
              New file
            </Link>
            <Link to="/admin/qr" className="btn btn-secondary">
              Print QR code
            </Link>
          </div>
        </div>
      ) : (
        <>
          <label className="field search">
            <span className="visually-hidden">Search patient files</span>
            <input
              className="input"
              type="search"
              placeholder="Search by file number, name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {!loading && query && data.total === 0 ? (
            <div className="empty">
              <h2>No files match “{query}”</h2>
              <p className="muted">Search by file number, patient name or phone number.</p>
            </div>
          ) : (
            <div className="table-wrap" aria-busy={loading}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">File no.</th>
                    <th scope="col">Patient</th>
                    <th scope="col">Phone</th>
                    <th scope="col" className="num col-optional">
                      Visits
                    </th>
                    <th scope="col" className="col-optional">
                      Last visit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.patients.map((patient) => (
                    <tr key={patient.id} onClick={() => navigate(`/admin/patients/${patient.id}`)}>
                      <td className="cell-file">{patient.fileNumber}</td>
                      <td>
                        <Link to={`/admin/patients/${patient.id}`} className="cell-link">
                          {patient.fullName}
                        </Link>
                      </td>
                      <td dir="ltr" className="cell-phone">
                        {patient.phone}
                      </td>
                      <td className="num col-optional">{patient.visitCount}</td>
                      <td className="col-optional">
                        {patient.lastVisit ? formatDate(patient.lastVisit) : <span className="muted">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.patients.length < data.total && (
            <div className="load-more">
              <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Show more (${data.total - data.patients.length} left)`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
