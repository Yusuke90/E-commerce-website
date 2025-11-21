// AdminDashboard.js - Complete Component
import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [pendingWholesalers, setPendingWholesalers] = useState([]);
  const [pendingRetailers, setPendingRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wholesalers');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending wholesalers
      const wholesalersRes = await fetch('http://localhost:5000/api/admin/wholesalers/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const wholesalersData = await wholesalersRes.json();
      setPendingWholesalers(wholesalersData);

      // Fetch pending retailers
      const retailersRes = await fetch('http://localhost:5000/api/admin/retailers/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const retailersData = await retailersRes.json();
      setPendingRetailers(retailersData);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveWholesaler = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/wholesaler/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Wholesaler approved successfully!');
        fetchPendingUsers(); // Refresh the list
      } else {
        alert('Failed to approve wholesaler');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error approving wholesaler');
    }
  };

  const approveRetailer = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/retailer/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Retailer approved successfully!');
        fetchPendingUsers(); // Refresh the list
      } else {
        alert('Failed to approve retailer');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error approving retailer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Approve pending wholesalers and retailers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-800">Pending Wholesalers</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{pendingWholesalers.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-800">Pending Retailers</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">{pendingRetailers.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('wholesalers')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'wholesalers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Wholesalers ({pendingWholesalers.length})
            </button>
            <button
              onClick={() => setActiveTab('retailers')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'retailers'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Retailers ({pendingRetailers.length})
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Wholesalers Tab */}
                {activeTab === 'wholesalers' && (
                  <div>
                    {pendingWholesalers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-gray-600 text-lg">No pending wholesalers</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingWholesalers.map(wholesaler => (
                          <div
                            key={wholesaler._id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                  {wholesaler.name}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Email:</span>
                                    <span className="ml-2 font-medium">{wholesaler.email}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Company:</span>
                                    <span className="ml-2 font-medium">
                                      {wholesaler.wholesalerInfo?.companyName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">GST:</span>
                                    <span className="ml-2 font-medium">
                                      {wholesaler.wholesalerInfo?.gstNumber}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="ml-2 font-medium">
                                      {wholesaler.wholesalerInfo?.phone}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-600">Address:</span>
                                    <span className="ml-2 font-medium">
                                      {wholesaler.wholesalerInfo?.address}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => approveWholesaler(wholesaler._id)}
                                className="ml-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Retailers Tab */}
                {activeTab === 'retailers' && (
                  <div>
                    {pendingRetailers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-gray-600 text-lg">No pending retailers</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingRetailers.map(retailer => (
                          <div
                            key={retailer._id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                  {retailer.name}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Email:</span>
                                    <span className="ml-2 font-medium">{retailer.email}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Shop:</span>
                                    <span className="ml-2 font-medium">
                                      {retailer.retailerInfo?.shopName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">GST:</span>
                                    <span className="ml-2 font-medium">
                                      {retailer.retailerInfo?.gstNumber}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="ml-2 font-medium">
                                      {retailer.retailerInfo?.phone}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-600">Address:</span>
                                    <span className="ml-2 font-medium">
                                      {retailer.retailerInfo?.address}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => approveRetailer(retailer._id)}
                                className="ml-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}