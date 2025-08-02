import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageCircle, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Plus,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    pendingMessages: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [campaignsResponse] = await Promise.all([
        axios.get('/api/campaigns')
      ]);

      const campaigns = campaignsResponse.data;
      
      // Calculer les statistiques
      let totalMessages = 0;
      let deliveredMessages = 0;
      let failedMessages = 0;
      let pendingMessages = 0;

      campaigns.forEach(campaign => {
        if (campaign.phone_numbers) {
          campaign.phone_numbers.forEach(number => {
            totalMessages++;
            if (number.status === 'delivered') deliveredMessages++;
            else if (number.status === 'failed') failedMessages++;
            else pendingMessages++;
          });
        }
      });

      setStats({
        totalCampaigns: campaigns.length,
        totalMessages,
        deliveredMessages,
        failedMessages,
        pendingMessages
      });

      setRecentCampaigns(campaigns.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-yellow-700 bg-yellow-100';
      case 'sending': return 'text-whatsapp-700 bg-whatsapp-100';
      case 'completed': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const chartData = [
    { name: 'Livrés', value: stats.deliveredMessages, color: '#25D366' },
    { name: 'Échoués', value: stats.failedMessages, color: '#ef4444' },
    { name: 'En attente', value: stats.pendingMessages, color: '#f59e0b' }
  ];

  const weeklyData = [
    { name: 'Lun', campagnes: 3, messages: 150 },
    { name: 'Mar', campagnes: 5, messages: 280 },
    { name: 'Mer', campagnes: 2, messages: 120 },
    { name: 'Jeu', campagnes: 7, messages: 350 },
    { name: 'Ven', campagnes: 4, messages: 200 },
    { name: 'Sam', campagnes: 1, messages: 50 },
    { name: 'Dim', campagnes: 0, messages: 0 }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de vos campagnes WhatsApp</p>
        </div>
        <Link
          to="/campaigns/create"
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-whatsapp-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-whatsapp-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Campagnes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-whatsapp-100 rounded-lg">
              <Users className="h-6 w-6 text-whatsapp-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-whatsapp-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-whatsapp-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Livrés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveredMessages}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.failedMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique circulaire des statuts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des messages</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique en barres de l'activité hebdomadaire */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité hebdomadaire</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="campagnes" fill="#25D366" name="Campagnes" />
                <Bar dataKey="messages" fill="#128C7E" name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campagnes récentes */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Campagnes récentes</h3>
                        <Link to="/campaigns" className="text-whatsapp-600 hover:text-whatsapp-500 text-sm font-medium">
                Voir toutes
              </Link>
        </div>
        
        {recentCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune campagne</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première campagne.</p>
            <div className="mt-6">
              <Link to="/campaigns/create" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Créer une campagne
              </Link>
            </div>
          </div>
        ) : (
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCampaigns.map((campaign) => (
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
                      {campaign.phone_numbers?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 