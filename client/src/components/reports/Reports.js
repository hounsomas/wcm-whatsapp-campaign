import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

const Reports = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns');
      setCampaigns(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      setLoading(false);
    }
  };

  const getDeliveryStats = (campaign) => {
    if (!campaign.phone_numbers) return { delivered: 0, failed: 0, pending: 0, total: 0 };
    
    const stats = campaign.phone_numbers.reduce((acc, number) => {
      acc.total++;
      if (number.status === 'delivered') acc.delivered++;
      else if (number.status === 'failed') acc.failed++;
      else acc.pending++;
      return acc;
    }, { delivered: 0, failed: 0, pending: 0, total: 0 });
    
    return stats;
  };

  const getOverallStats = () => {
    const overall = campaigns.reduce((acc, campaign) => {
      const stats = getDeliveryStats(campaign);
      acc.totalCampaigns++;
      acc.totalMessages += stats.total;
      acc.deliveredMessages += stats.delivered;
      acc.failedMessages += stats.failed;
      acc.pendingMessages += stats.pending;
      return acc;
    }, { totalCampaigns: 0, totalMessages: 0, deliveredMessages: 0, failedMessages: 0, pendingMessages: 0 });
    
    return overall;
  };

  const getFilteredCampaigns = () => {
    if (selectedCampaign === 'all') return campaigns;
    return campaigns.filter(campaign => campaign.id === selectedCampaign);
  };

  const getWeeklyData = () => {
    const now = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCampaigns = campaigns.filter(campaign => {
        const campaignDate = new Date(campaign.created_at).toISOString().split('T')[0];
        return campaignDate === dateStr;
      });
      
      const dayStats = dayCampaigns.reduce((acc, campaign) => {
        const stats = getDeliveryStats(campaign);
        acc.campaigns++;
        acc.messages += stats.total;
        acc.delivered += stats.delivered;
        acc.failed += stats.failed;
        return acc;
      }, { campaigns: 0, messages: 0, delivered: 0, failed: 0 });
      
      weekData.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        campaigns: dayStats.campaigns,
        messages: dayStats.messages,
        delivered: dayStats.delivered,
        failed: dayStats.failed
      });
    }
    
    return weekData;
  };

  const getStatusDistribution = () => {
    const statusCounts = campaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'scheduled': return '#f59e0b';
      case 'sending': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const overallStats = getOverallStats();
  const weeklyData = getWeeklyData();
  const statusDistribution = getStatusDistribution();
  const filteredCampaigns = getFilteredCampaigns();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600">Analysez les performances de vos campagnes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="input-field"
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-whatsapp-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-whatsapp-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Campagnes</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages totaux</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Livrés</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.deliveredMessages}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Échoués</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.failedMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité hebdomadaire */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité hebdomadaire</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="campaigns" fill="#25D366" name="Campagnes" />
                <Bar dataKey="messages" fill="#128C7E" name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution des statuts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des statuts</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Graphique linéaire des performances */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des messages</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="delivered" stroke="#25D366" name="Livrés" strokeWidth={2} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Échoués" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau des campagnes */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Détail des campagnes</h3>
          <button className="btn-secondary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campagne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livrés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échoués
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux de succès
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => {
                const stats = getDeliveryStats(campaign);
                const successRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {stats.delivered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {stats.failed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${successRate >= 80 ? 'text-whatsapp-600' : successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {successRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 