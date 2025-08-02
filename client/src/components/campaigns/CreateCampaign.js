import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Upload, 
  X, 
  MessageCircle, 
  Image, 
  Video, 
  FileText,
  Calendar,
  Users,
  Send
} from 'lucide-react';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const message = watch('message', '');

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      toast.success('Fichier uploadé avec succès');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 16 * 1024 * 1024 // 16MB
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    return <FileText className="h-8 w-8 text-green-500" />;
  };

  const onSubmit = async (data) => {
    if (!phoneNumbers.trim()) {
      toast.error('Veuillez ajouter au moins un numéro de téléphone');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('message', data.message);
      
      if (uploadedFile) {
        formData.append('media', uploadedFile);
      }

      // Traiter les numéros de téléphone
      const numbers = phoneNumbers
        .split('\n')
        .map(num => num.trim())
        .filter(num => num.length > 0);
      
      formData.append('phone_numbers', JSON.stringify(numbers));

      if (isScheduled && scheduledDate) {
        formData.append('scheduled_time', scheduledDate.toISOString());
      }

      const response = await axios.post('/api/campaigns', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Campagne créée avec succès !');
      navigate('/campaigns');
    } catch (error) {
      const message = error.response?.data?.error || 'Erreur lors de la création de la campagne';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle campagne</h1>
          <p className="text-gray-600">Créez et programmez votre campagne WhatsApp</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations de base */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la campagne *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Le nom est requis' })}
                className="input-field"
                placeholder="Ex: Promotion été 2024"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                {...register('description')}
                className="input-field"
                placeholder="Description optionnelle"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              {...register('message', { required: 'Le message est requis' })}
              rows={4}
              className="input-field"
              placeholder="Tapez votre message WhatsApp ici..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              {message.length} caractères
            </div>
          </div>
        </div>

        {/* Média */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Média (optionnel)</h3>
          
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive
                  ? 'Déposez le fichier ici...'
                  : 'Glissez-déposez un fichier ici, ou cliquez pour sélectionner'
                }
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Images, vidéos, PDF, documents (max 16MB)
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getFileIcon(uploadedFile)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Numéros de téléphone */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Users className="inline h-5 w-5 mr-2" />
            Numéros de téléphone
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéros de téléphone * (un par ligne)
            </label>
            <textarea
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              rows={6}
              className="input-field"
              placeholder="+33123456789&#10;+33123456790&#10;+33123456791"
            />
            <p className="mt-2 text-sm text-gray-500">
              Format international recommandé (ex: +33123456789)
            </p>
          </div>
        </div>

        {/* Programmation */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Calendar className="inline h-5 w-5 mr-2" />
            Programmation
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="scheduled"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="h-4 w-4 text-whatsapp-600 focus:ring-whatsapp-500 border-gray-300 rounded"
              />
              <label htmlFor="scheduled" className="ml-2 text-sm text-gray-700">
                Programmer l'envoi
              </label>
            </div>
            
            {isScheduled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure d'envoi
                </label>
                <DatePicker
                  selected={scheduledDate}
                  onChange={(date) => setScheduledDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  minDate={new Date()}
                  className="input-field"
                  placeholderText="Sélectionnez la date et l'heure"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isScheduled ? 'Programmer la campagne' : 'Créer la campagne'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign; 