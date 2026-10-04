"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface RescueTeam {
  _id: string;
  name: string;
  leadOfficer: string;
  memberCount: number;
  district: string;
  location: string;
  expertise: string;
  isAvailable: boolean;
  status?: string;
  contactNumbers?: string[];
  equipmentList?: string;
  members?: TeamMember[];
}

interface TeamMember {
  name: string;
  contactNo: string;
}

export default function RescueTeamsPage() {
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    leadOfficer: "",
    location: "",
    expertise: "Fire",
    equipmentList: "",
    memberCount: 0,
  });
  
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedTeam, setEditedTeam] = useState<RescueTeam | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/rescue-teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Filtered teams logic
  const uniqueLocations = Array.from(new Set(teams.map(t => t.location || t.district).filter(Boolean)));
  
  const filteredTeams = teams.filter(team => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      team.leadOfficer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.expertise || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const teamStatus = team.status || (team.isAvailable ? 'Active' : 'Inactive');
    const matchesStatus = statusFilter === "All" || teamStatus === statusFilter;
    
    const teamLocation = team.location || team.district;
    const matchesLocation = locationFilter === "All" || teamLocation === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "memberCount" ? parseInt(value) || 0 : value });
  };

  const handleContactChange = (index: number, value: string) => {
    const newContacts = [...contactNumbers];
    newContacts[index] = value;
    setContactNumbers(newContacts);
  };

  const addContactNumber = () => {
    if (contactNumbers.length < 5) {
      setContactNumbers([...contactNumbers, ""]);
    }
  };

  const removeContactNumber = (index: number) => {
    const newContacts = [...contactNumbers];
    newContacts.splice(index, 1);
    setContactNumbers(newContacts);
  };

  const addMemberRow = () => {
    if (members.length < formData.memberCount) {
      setMembers([...members, { name: "", contactNo: "" }]);
    }
  };

  const removeMemberRow = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/rescue-teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          contactNumbers: contactNumbers.filter(c => c.trim() !== ""),
          members: members.filter(m => m.name.trim() !== ""),
        }),
      });

      if (res.ok) {
        setFormData({
          name: "",
          leadOfficer: "",
          location: "",
          expertise: "Fire",
          equipmentList: "",
          memberCount: 0,
        });
        setContactNumbers([""]);
        setMembers([]);
        fetchTeams();
      }
    } catch (error) {
      console.error("Failed to submit team:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTeam) return;
    setUpdatingStatus(true);
    
    try {
      const res = await fetch(`/api/rescue-teams/${selectedTeam._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeams(teams.map(t => t._id === updatedTeam._id ? updatedTeam : t));
        setSelectedTeam(updatedTeam);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!editedTeam) return;
    setUpdatingStatus(true);
    
    try {
      const res = await fetch(`/api/rescue-teams/${editedTeam._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedTeam.name,
          leadOfficer: editedTeam.leadOfficer,
          location: editedTeam.location,
          expertise: editedTeam.expertise,
          equipmentList: editedTeam.equipmentList,
          contactNumbers: editedTeam.contactNumbers?.filter(c => c.trim() !== "") || [],
          members: editedTeam.members?.filter(m => m.name.trim() !== "") || []
        }),
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeams(teams.map(t => t._id === updatedTeam._id ? updatedTeam : t));
        setSelectedTeam(updatedTeam);
        setIsEditingDetails(false);
      }
    } catch (error) {
      console.error("Failed to update team details:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openModal = (team: RescueTeam) => {
    setSelectedTeam(team);
    setEditedTeam(JSON.parse(JSON.stringify(team))); // deep copy
    setIsEditingDetails(false);
    setIsModalOpen(true);
  };

  const getStatusBadge = (team: RescueTeam) => {
    const status = team.status || (team.isAvailable ? 'Active' : 'Inactive');
    
    if (status === 'Active') {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400">Active</span>;
    }
    if (status === 'Standby') {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-400">Standby</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400">Inactive</span>;
  };

  return (
    <div className="space-y-6 relative">
      <h1 className="text-2xl font-black text-white mb-2">Rescue Teams</h1>

      {/* Registration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Register New Rescue Team</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 mt-4 md:mt-0">
              <label className="text-xs font-semibold text-slate-400">Team Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Team Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Primary Expertise</label>
              <select
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Fire">Fire</option>
                <option value="Flood">Flood</option>
                <option value="Landslide">Landslide</option>
                <option value="Medical">Medical</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Team Leader Name</label>
              <input
                type="text"
                name="leadOfficer"
                required
                placeholder="Team Leader Name"
                value={formData.leadOfficer}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Team Location</label>
              <input
                type="text"
                name="location"
                placeholder="Team Location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Number of Members</label>
              <input
                type="number"
                name="memberCount"
                min="0"
                required
                placeholder="0"
                value={formData.memberCount}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {/* Contact Numbers (Up to 5) */}
            <div className="space-y-2 col-span-full md:col-span-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">Contact Numbers ({contactNumbers.length}/5)</label>
                {contactNumbers.length < 5 && (
                  <button type="button" onClick={addContactNumber} className="text-xs text-blue-400 hover:text-blue-300 flex items-center">
                    <Plus className="w-3 h-3 mr-0.5" /> Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {contactNumbers.map((contact, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      required={index === 0}
                      placeholder={`Contact Number ${index + 1}`}
                      value={contact}
                      onChange={(e) => handleContactChange(index, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    {contactNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactNumber(index)}
                        className="p-2 text-slate-500 hover:text-red-400 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-semibold text-slate-400">Team Equipment List</label>
            <textarea
              name="equipmentList"
              rows={4}
              placeholder="E.g., 2 Boats, 5 First-Aid Kits..."
              value={formData.equipmentList}
              onChange={handleChange}
              className="w-full h-full min-h-[104px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>

          {/* Add Members Section */}
          <div className="col-span-full border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Team Members ({members.length}/{formData.memberCount})</h3>
              <button
                type="button"
                onClick={addMemberRow}
                disabled={members.length >= formData.memberCount}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>
            
            {members.length > 0 && (
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={index} className="flex gap-4 items-end bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Member Name</label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Contact Number</label>
                      <input
                        type="text"
                        placeholder="Contact"
                        value={member.contactNo}
                        onChange={(e) => handleMemberChange(index, "contactNo", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMemberRow(index)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors mb-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {members.length === 0 && formData.memberCount > 0 && (
              <p className="text-xs text-slate-500 italic">Click "Add Member" to add team members.</p>
            )}
          </div>

          <div className="col-span-full pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Team"}
            </button>
          </div>
        </form>
      </div>

      {/* Teams List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Registered Rescue Teams</h2>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Standby">Standby</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select 
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map((loc, idx) => (
                <option key={idx} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-tl-lg">Team Name</th>
                <th className="px-4 py-3 font-semibold">Leader</th>
                <th className="px-4 py-3 font-semibold">Members</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Expertise</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading teams...</td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No rescue teams registered yet.</td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No rescue teams match your filters.</td>
                </tr>
              ) : (
                filteredTeams.map((team) => (
                  <tr key={team._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-4 py-4">{team.name}</td>
                    <td className="px-4 py-4">{team.leadOfficer}</td>
                    <td className="px-4 py-4">{team.memberCount}</td>
                    <td className="px-4 py-4">{team.location || team.district}</td>
                    <td className="px-4 py-4">{team.expertise || "-"}</td>
                    <td className="px-4 py-4">
                      {getStatusBadge(team)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => openModal(team)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Details Modal */}
      {isModalOpen && selectedTeam && editedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">
                {isEditingDetails ? "Edit Team Details" : "Team Details"}
              </h2>
              <div className="flex gap-2">
                {!isEditingDetails ? (
                  <button 
                    onClick={() => setIsEditingDetails(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setEditedTeam(JSON.parse(JSON.stringify(selectedTeam)));
                        setIsEditingDetails(false);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveDetails}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {updatingStatus ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Team Name</p>
                  {isEditingDetails ? (
                    <input 
                      type="text"
                      value={editedTeam.name}
                      onChange={(e) => setEditedTeam({...editedTeam, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-white font-medium">{selectedTeam.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Location</p>
                  {isEditingDetails ? (
                    <input 
                      type="text"
                      value={editedTeam.location || editedTeam.district}
                      onChange={(e) => setEditedTeam({...editedTeam, location: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-white font-medium">{selectedTeam.location || selectedTeam.district}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Team Leader</p>
                  {isEditingDetails ? (
                    <input 
                      type="text"
                      value={editedTeam.leadOfficer}
                      onChange={(e) => setEditedTeam({...editedTeam, leadOfficer: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-white font-medium">{selectedTeam.leadOfficer}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Expertise</p>
                  {isEditingDetails ? (
                    <select
                      value={editedTeam.expertise || "Fire"}
                      onChange={(e) => setEditedTeam({...editedTeam, expertise: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Fire">Fire</option>
                      <option value="Flood">Flood</option>
                      <option value="Landslide">Landslide</option>
                      <option value="Medical">Medical</option>
                    </select>
                  ) : (
                    <p className="text-sm text-white font-medium">{selectedTeam.expertise || "Unknown"}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-slate-400 font-medium">Team Contact Numbers</p>
                  {isEditingDetails && (editedTeam.contactNumbers?.length || 0) < 5 && (
                    <button 
                      onClick={() => setEditedTeam({...editedTeam, contactNumbers: [...(editedTeam.contactNumbers || []), ""]})}
                      className="text-xs text-blue-400 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Add
                    </button>
                  )}
                </div>
                
                {isEditingDetails ? (
                  <div className="space-y-2">
                    {editedTeam.contactNumbers?.map((no, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text"
                          value={no}
                          onChange={(e) => {
                            const newContacts = [...(editedTeam.contactNumbers || [])];
                            newContacts[idx] = e.target.value;
                            setEditedTeam({...editedTeam, contactNumbers: newContacts});
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                        <button 
                          onClick={() => {
                            const newContacts = [...(editedTeam.contactNumbers || [])];
                            newContacts.splice(idx, 1);
                            setEditedTeam({...editedTeam, contactNumbers: newContacts});
                          }}
                          className="p-1.5 bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedTeam.contactNumbers && selectedTeam.contactNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTeam.contactNumbers.map((no, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">{no}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No contact numbers available.</p>
                  )
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">Equipment List</p>
                {isEditingDetails ? (
                  <textarea
                    rows={3}
                    value={editedTeam.equipmentList || ""}
                    onChange={(e) => setEditedTeam({...editedTeam, equipmentList: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                ) : (
                  selectedTeam.equipmentList && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedTeam.equipmentList}</p>
                    </div>
                  )
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-slate-400 font-medium">Team Members ({(editedTeam.members || []).length})</p>
                  {isEditingDetails && (
                    <button 
                      onClick={() => setEditedTeam({...editedTeam, members: [...(editedTeam.members || []), { name: "", contactNo: "" }]})}
                      className="text-xs text-blue-400 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Add Member
                    </button>
                  )}
                </div>
                
                {isEditingDetails ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {editedTeam.members?.map((member, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <input 
                          type="text"
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => {
                            const newMembers = [...(editedTeam.members || [])];
                            newMembers[idx].name = e.target.value;
                            setEditedTeam({...editedTeam, members: newMembers});
                          }}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        <input 
                          type="text"
                          placeholder="Contact"
                          value={member.contactNo}
                          onChange={(e) => {
                            const newMembers = [...(editedTeam.members || [])];
                            newMembers[idx].contactNo = e.target.value;
                            setEditedTeam({...editedTeam, members: newMembers});
                          }}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        <button 
                          onClick={() => {
                            const newMembers = [...(editedTeam.members || [])];
                            newMembers.splice(idx, 1);
                            setEditedTeam({...editedTeam, members: newMembers});
                          }}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedTeam.members && selectedTeam.members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                      {selectedTeam.members.map((member, idx) => (
                        <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                          <span className="text-sm text-white">{member.name}</span>
                          <span className="text-xs text-slate-400">{member.contactNo}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                )}
              </div>

              {!isEditingDetails && (
                <div className="border-t border-slate-800 pt-6">
                  <p className="text-sm text-white font-semibold mb-3">Change Team Status</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleStatusChange('Active')}
                      disabled={updatingStatus || (selectedTeam.status || (selectedTeam.isAvailable ? 'Active' : 'Inactive')) === 'Active'}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Active
                    </button>
                    <button 
                      onClick={() => handleStatusChange('Standby')}
                      disabled={updatingStatus || (selectedTeam.status || (selectedTeam.isAvailable ? 'Active' : 'Inactive')) === 'Standby'}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Standby
                    </button>
                    <button 
                      onClick={() => handleStatusChange('Inactive')}
                      disabled={updatingStatus || (selectedTeam.status || (selectedTeam.isAvailable ? 'Active' : 'Inactive')) === 'Inactive'}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Inactive
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
