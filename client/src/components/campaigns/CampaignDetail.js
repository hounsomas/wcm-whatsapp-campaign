import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  MessageCircle,
  Calendar,
  FileText,
  Image,
  Video,
  BarChart3
} from 'lucide-react';

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await axios.get(`/api/campaigns/${id}`);
      setCampaign(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement de la campagne:', error);
      toast.error('Erreur lors du chargement de la campagne');
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    setSending(true);
    try {
      await axios.post(`/api/campaigns/${id}/send`);
      toast.success('Campagne en cours d\'envoi');
      fetchCampaign(); // Recharger pour mettre à jour les statuts
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la campagne');
    } finally {
      setSending(false);
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

  const getMediaIcon = (mediaType) => {
    if (mediaType?.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
    if (mediaType?.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4 text-green-500" />;
  };

  const getDeliveryStats = () => {
    if (!campaign?.phone_numbers) return { delivered: 0, failed: 0, pending: 0, total: 0 };
    
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

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Campagne non trouvée</h3>
        <p className="mt-1 text-sm text-gray-500">La campagne que vous recherchez n'existe pas.</p>
        <Link to="/campaigns" className="mt-4 btn-primary">
          Retour aux campagnes
        </Link>
      </div>
    );
  }

  const stats = getDeliveryStats();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/campaigns" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600">Détails de la campagne</p>
          </div>
        </div>
        
        {campaign.status === 'draft' && (
          <button
            onClick={handleSendCampaign}
            disabled={sending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {sending ? 'Envoi...' : 'Envoyer la campagne'}
          </button>
        )}
      </div>

      {/* Informations de la campagne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la campagne */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la campagne</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Statut</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {getStatusIcon(campaign.status)}
                  <span className="ml-1">{getStatusText(campaign.status)}</span>
                </span>
              </div>
              
              {campaign.description && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Description</span>
                  <p className="mt-1 text-sm text-gray-900">{campaign.description}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-500">Message</span>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{campaign.message}</p>
                </div>
              </div>
              
              {campaign.media_url && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Média</span>
                  <div className="mt-1 flex items-center space-x-2">
                    {getMediaIcon(campaign.media_type)}
                    <a
                      href={campaign.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-whatsapp-600 hover:text-whatsapp-500"
                    >
                      Voir le fichier
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Créée le</span>
                <span className="text-sm text-gray-900">
                  {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              {campaign.scheduled_time && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Programmée pour</span>
                  <span className="text-sm text-gray-900">
                    {new Date(campaign.scheduled_time).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Liste des numéros de téléphone */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Users className="inline h-5 w-5 mr-2" />
              Numéros de téléphone ({campaign.phone_numbers?.length || 0})
            </h3>
            
            {campaign.phone_numbers && campaign.phone_numbers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Envoyé le
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Livré le
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erreur
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaign.phone_numbers.map((number, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {number.phone_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(number.status)}`}>
                            {getStatusIcon(number.status)}
                            <span className="ml-1">{getStatusText(number.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {number.sent_at ? new Date(number.sent_at).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {number.delivered_at ? new Date(number.delivered_at).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {number.error_message || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun numéro de téléphone associé à cette campagne.</p>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <MessageCircle className="inline h-5 w-5 mr-2" />
              Statistiques
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total</span>
                <span className="text-lg font-semibold text-gray-900">{stats.total}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Livrés</span>
                <span className="text-lg font-semibold text-green-600">{stats.delivered}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Échoués</span>
                <span className="text-lg font-semibold text-red-600">{stats.failed}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">En attente</span>
                <span className="text-lg font-semibold text-yellow-600">{stats.pending}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Taux de succès</span>
                  <span className="text-lg font-semibold text-whatsapp-600">
                    {stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <Link
                to={`/campaigns/${id}/report`}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir le rapport complet
              </Link>
              
              {campaign.status === 'draft' && (
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {sending ? 'Envoi...' : 'Envoyer maintenant'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail; 