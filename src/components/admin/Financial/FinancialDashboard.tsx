import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar as CalendarIcon, CreditCard, Filter, X, Loader2 } from 'lucide-react';
import { Card } from '../../ui/card';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { financialService } from '../../../services/api/financial.service';
import { usePermissions } from '../../../hooks/usePermissions';

export function FinancialDashboard() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  
  // États des filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'both' | 'revenue' | 'expenses'>('both');
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isFiltered, setIsFiltered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Charger les données au montage du composant
  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);

      const filters = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        type: filterType
      };

      // Charger toutes les données en parallèle
      const [statsResponse, dataResponse, transactionsResponse] = await Promise.all([
        financialService.getFinancialStats(filters),
        financialService.getFinancialData(filters),
        financialService.getTransactionSummary(filters)
      ]);

      setData({
        stats: statsResponse.data,
        charts: dataResponse.data,
        transactions: transactionsResponse.data
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
      toast.error('Erreur de connexion au serveur');
      
      // Fallback avec données de démonstration
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    setData({
      stats: {
        todayRevenue: 52000,
        weekRevenue: 340000,
        monthRevenue: 1250000,
        avgRevenuePerTrip: 583,
        totalTrips: 1247,
        totalUsers: 892
      },
      charts: {
        shortTerm: generateMockChartData(7),
        longTerm: generateMockChartData(30),
        planDistribution: [
          { name: 'Standard', value: 45, color: '#10b981' },
          { name: 'Heures de Pointe', value: 25, color: '#f59e0b' },
          { name: 'Weekend', value: 20, color: '#3b82f6' },
          { name: 'Étudiant', value: 10, color: '#8b5cf6' }
        ]
      },
      transactions: {
        topUps: { total: 842000, count: 156 },
        payments: { total: 624000, count: 256 },
        maintenance: { total: 85000, count: 12 },
        refunds: { total: 12500, count: 8 },
        userBalances: 218000
      }
    });
  };

  const generateMockChartData = (days: number) => {
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      chartData.push({
        period: format(currentDate, 'dd/MM', { locale: fr }),
        revenue: Math.floor(Math.random() * 30000) + 40000,
        expenses: Math.floor(Math.random() * 8000) + 10000,
        trips: Math.floor(Math.random() * 20) + 25
      });
    }
    return chartData;
  };

  // Fonction pour appliquer les filtres
  const applyFilters = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Vérifier que la date de fin n'est pas dans le futur
    if (endDate > today) {
      toast.error(t('financial.endDateFuture'));
      return;
    }
    
    // Vérifier que la date de début est avant la date de fin
    if (startDate > endDate) {
      toast.error(t('financial.invalidDateRange'));
      return;
    }
    
    setIsFiltered(true);
    await loadFinancialData();
    toast.success(t('financial.filtersApplied'));
  };

  const resetFilters = async () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    setStartDate(date);
    setEndDate(new Date());
    setFilterType('both');
    setIsFiltered(false);
    await loadFinancialData();
    toast.info(t('financial.filtersReset'));
  };

  // Calculer le nombre de jours dans la période sélectionnée
  const getDaysDifference = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysDifference = getDaysDifference();

  // Générer les titres dynamiques pour les graphiques
  const getChartTitle = (chartNumber: 1 | 2) => {
    let baseTitle = '';
    
    if (chartNumber === 1) {
      if (daysDifference <= 7) {
        baseTitle = daysDifference === 0 
          ? `Données du ${format(startDate, 'dd MMMM yyyy', { locale: fr })}`
          : `Données journalières (${format(startDate, 'dd/MM', { locale: fr })} - ${format(endDate, 'dd/MM', { locale: fr })})`;
      } else if (daysDifference <= 31) {
        baseTitle = `Données hebdomadaires (${format(startDate, 'dd/MM', { locale: fr })} - ${format(endDate, 'dd/MM', { locale: fr })})`;
      } else {
        baseTitle = `Données mensuelles (${format(startDate, 'MMM yyyy', { locale: fr })} - ${format(endDate, 'MMM yyyy', { locale: fr })})`;
      }
    } else {
      if (daysDifference <= 31) {
        baseTitle = `Évolution journalière (${format(startDate, 'dd/MM', { locale: fr })} - ${format(endDate, 'dd/MM', { locale: fr })})`;
      } else {
        baseTitle = `Évolution mensuelle (${format(startDate, 'MMM yyyy', { locale: fr })} - ${format(endDate, 'MMM yyyy', { locale: fr })})`;
      }
    }
    
    if (filterType === 'revenue') {
      return `${baseTitle} - ${t('financial.revenueOnly')}`;
    } else if (filterType === 'expenses') {
      return `${baseTitle} - ${t('financial.expensesOnly')}`;
    }
    return baseTitle;
  };

  const stats = data ? [
    {
      title: 'Revenus du Jour',
      value: `${data.stats.todayRevenue.toLocaleString()} FCFA`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('financial.weekRevenue') || 'Revenus de la Semaine',
      value: `${data.stats.weekRevenue.toLocaleString()} FCFA`,
      change: '+12%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('financial.monthRevenue') || 'Revenus du Mois',
      value: `${data.stats.monthRevenue.toLocaleString()} FCFA`,
      change: '+6%',
      trend: 'up',
      icon: CalendarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('financial.avgRevenuePerTrip') || 'Revenu Moyen/Trajet',
      value: `${Math.round(data.stats.avgRevenuePerTrip)} FCFA`,
      change: '-2%',
      trend: 'down',
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ] : [];

  // Préparer les données pour l'export
  const exportData = data ? [
    ...data.charts.shortTerm.map((item: any) => ({
      [t('financial.period') || 'Période']: item.period,
      [t('financial.revenue') || 'Revenus']: item.revenue,
      [t('financial.expenses') || 'Dépenses']: item.expenses,
      [t('financial.trips') || 'Trajets']: item.trips || '-'
    })),
    ...data.charts.longTerm.map((item: any) => ({
      [t('financial.period') || 'Période']: item.period,
      [t('financial.revenue') || 'Revenus']: item.revenue,
      [t('financial.expenses') || 'Dépenses']: item.expenses,
      [t('financial.trips') || 'Trajets']: '-'
    }))
  ] : [];

  const handleExport = async () => {
    try {
      const filters = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        type: filterType
      };
      
      await financialService.exportFinancialData(filters);
      toast.success(t('financial.exportSuccess') || 'Données exportées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error(t('financial.exportError') || 'Erreur lors de l\'export des données');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">{t('financial.loading') || 'Chargement des données financières...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-green-600">{t('financial.dashboard') || 'Tableau de Bord Financier'}</h1>
          <p className="text-gray-600">{t('financial.analysis') || 'Analyses des revenus et performances financières'}</p>
        </div>
        <div className="flex gap-2">
          {can.exportWallet() && (
            <Button onClick={handleExport} className="gap-2" aria-label={t('aria.exportData') || 'Exporter les données'} title={t('aria.exportData') || 'Exporter les données'}>
              <i className="w-4 h-4" />
              {t('financial.export') || 'Exporter'}
            </Button>
          )}
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('common.filter')}
          </Button>
          <Button
            variant="outline"
            onClick={loadFinancialData}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t('common.refresh') || 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Filtres personnalisés */}
      {showFilters && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-green-600">{t('financial.customFilters')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type de données */}
            <div className="space-y-2">
              <Label>{t('financial.dataType')}</Label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">{t('financial.revenueAndExpenses')}</SelectItem>
                  <SelectItem value="revenue">{t('financial.revenueOnly')}</SelectItem>
                  <SelectItem value="expenses">{t('financial.expensesOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de début */}
            <div className="space-y-2">
              <Label>{t('financial.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-base"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date: any) => date && setStartDate(date)}
                    disabled={(date: number) => date > Date.now()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <Label>{t('financial.endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-base"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date: any) => date && setEndDate(date)}
                    disabled={(date: number) => date > Date.now()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-2">
              <Label className="invisible">Actions</Label>
              <div className="flex gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  {t('financial.apply')}
                </Button>
                <Button onClick={resetFilters} variant="outline">
                  {t('common.reset')}
                </Button>
              </div>
            </div>
          </div>

          {isFiltered && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                {t('financial.activeFilters')}: {t(`financial.${filterType}`)} • {format(startDate, 'dd/MM/yyyy')} {t('common.to')} {format(endDate, 'dd/MM/yyyy')}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-gray-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Premier graphique - Court terme */}
          <Card className="p-6">
            <h3 className="mb-4">{getChartTitle(1)}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.shortTerm}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                  formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                {(filterType === 'both' || filterType === 'revenue') && (
                  <Bar dataKey="revenue" fill="#10b981" name={t('financial.revenue')} radius={[8, 8, 0, 0]} />
                )}
                {(filterType === 'both' || filterType === 'expenses') && (
                  <Bar dataKey="expenses" fill="#ef4444" name={t('financial.expenses')} radius={[8, 8, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Deuxième graphique - Long terme */}
          <Card className="p-6">
            <h3 className="mb-4">{getChartTitle(2)}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.charts.longTerm}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                  formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                {(filterType === 'both' || filterType === 'revenue') && (
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name={t('financial.revenue')} />
                )}
                {(filterType === 'both' || filterType === 'expenses') && (
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name={t('financial.expenses')} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Plan Distribution and Metrics */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Distribution */}
          <Card className="p-6 lg:col-span-1">
            <h3 className="mb-4">Répartition des Forfaits</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.charts.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.charts.planDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.charts.planDistribution.map((plan: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span>{plan.name}</span>
                  </div>
                  <span className="text-gray-600">{plan.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Metrics */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="mb-4">Métriques Clés</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Revenus Moyenne/Jour</p>
                  <p className="text-gray-900">{Math.round(data.stats.todayRevenue).toLocaleString()} FCFA</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Prix Moyen/Heure</p>
                  <p className="text-gray-900">225 FCFA</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Durée Moyenne</p>
                  <p className="text-gray-900">38 minutes</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Trajets/Jour</p>
                  <p className="text-gray-900">{Math.round(data.stats.totalTrips / 30)} trajets</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Taux d'Occupation</p>
                  <p className="text-gray-900">68%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Distance Totale</p>
                  <p className="text-gray-900">1,245 km</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Transaction Summary */}
      {data && (
        <Card className="p-6">
          <h3 className="mb-4">{t('financial.transactionSummary')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(filterType === 'both' || filterType === 'revenue') && (
              <>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('financial.totalTopUps')}</p>
                  <p className="text-green-600">{data.transactions.topUps.total.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-500 mt-1">{data.transactions.topUps.count} transactions</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('financial.totalPayments')}</p>
                  <p className="text-blue-600">{data.transactions.payments.total.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-500 mt-1">{data.transactions.payments.count} transactions</p>
                </div>
              </>
            )}
            {(filterType === 'both' || filterType === 'expenses') && (
              <>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('financial.maintenance')}</p>
                  <p className="text-red-600">{data.transactions.maintenance.total.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-500 mt-1">{data.transactions.maintenance.count} interventions</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('financial.refunds')}</p>
                  <p className="text-orange-600">{data.transactions.refunds.total.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-500 mt-1">{data.transactions.refunds.count} transactions</p>
                </div>
              </>
            )}
            {filterType === 'both' && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('financial.userBalances')}</p>
                <p className="text-purple-600">{data.transactions.userBalances.toLocaleString()} FCFA</p>
                <p className="text-xs text-gray-500 mt-1">{t('financial.availableCredits')}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}