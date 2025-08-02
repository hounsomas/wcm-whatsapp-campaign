import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3
} from 'lucide-react';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns');
      setCampaigns(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      toast.error('Erreur lors du chargement des campagnes');
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await axios.post(`/api/campaigns/${campaignId}/send`);
      toast.success('Campagne en cours d\'envoi');
      fetchCampaigns(); // Recharger pour mettre à jour les statuts
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la campagne');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sending': return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-yellow-700 bg-yellow-100';
      case 'sending': return 'text-blue-700 bg-blue-100';
      case 'completed': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'scheduled': return 'Programmée';
      case 'sending': return 'En cours';
      case 'completed': return 'Terminée';
      case 'failed': return 'Échouée';
      default: return status;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-gray-600">Gérez vos campagnes WhatsApp</p>
        </div>
        <Link to="/campaigns/create" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une campagne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="scheduled">Programmée</option>
              <option value="sending">En cours</option>
              <option value="completed">Terminée</option>
              <option value="failed">Échouée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des campagnes */}
      {filteredCampaigns.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune campagne trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche.'
              : 'Commencez par créer votre première campagne.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <div className="mt-6">
              <Link to="/campaigns/create" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Créer une campagne
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => {
            const stats = getDeliveryStats(campaign);
            return (
              <div key={campaign.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1">{getStatusText(campaign.status)}</span>
                      </span>
                    </div>
                    
                    {campaign.description && (
                      <p className="mt-1 text-sm text-gray-600">{campaign.description}</p>
                    )}
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Messages</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Livrés</p>
                        <p className="text-lg font-semibold text-green-600">{stats.delivered}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Échoués</p>
                        <p className="text-lg font-semibold text-red-600">{stats.failed}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">En attente</p>
                        <p className="text-lg font-semibold text-yellow-600">{stats.pending}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                      {campaign.scheduled_time && (
                        <span className="ml-4">
                          Programmée pour le {new Date(campaign.scheduled_time).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    
                    <Link
                      to={`/campaigns/${campaign.id}/report`}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Voir le rapport"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                    
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleSendCampaign(campaign.id)}
                        className="p-2 text-whatsapp-400 hover:text-whatsapp-600 rounded-lg hover:bg-whatsapp-50"
                        title="Envoyer la campagne"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    
                    <div className="relative">
                      <button
                        onClick={() => setSelectedCampaign(selectedCampaign === campaign.id ? null : campaign.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {selectedCampaign === campaign.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <Link
                              to={`/campaigns/${campaign.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Voir les détails
                            </Link>
                            <Link
                              to={`/campaigns/${campaign.id}/report`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Voir le rapport
                            </Link>
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => handleSendCampaign(campaign.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Envoyer la campagne
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignList; 