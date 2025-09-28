'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    totalArticles: 0,
    publishedArticles: 0,
    totalComments: 0,
    activeUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this data from your API
        const statsResponse = await fetch('/api/admin/stats');
        const activityResponse = await fetch('/api/admin/activity');
        
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data);
        }
        
        if (activityResponse.ok) {
          const data = await activityResponse.json();
          setRecentActivity(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description={`+${stats.newUsers} this month`}
          icon={Icons.users}
          iconColor="text-blue-500"
          iconBg="bg-blue-100"
        />
        <StatsCard
          title="Total Articles"
          value={stats.totalArticles}
          description={`${stats.publishedArticles} published`}
          icon={Icons.fileText}
          iconColor="text-green-500"
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Total Comments"
          value={stats.totalComments}
          description="All-time comments"
          icon={Icons.messageSquare}
          iconColor="text-purple-500"
          iconBg="bg-purple-100"
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          description="Active this month"
          icon={Icons.activity}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-100"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              The most recent activities on your platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent activity to display.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and quick actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button className="flex w-full items-center rounded-md border p-3 text-left text-sm transition-all hover:bg-accent">
                <Icons.userPlus className="mr-2 h-4 w-4" />
                Add New User
              </button>
              <button className="flex w-full items-center rounded-md border p-3 text-left text-sm transition-all hover:bg-accent">
                <Icons.filePlus className="mr-2 h-4 w-4" />
                Create Article
              </button>
              <button className="flex w-full items-center rounded-md border p-3 text-left text-sm transition-all hover:bg-accent">
                <Icons.settings className="mr-2 h-4 w-4" />
                System Settings
              </button>
              <button className="flex w-full items-center rounded-md border p-3 text-left text-sm transition-all hover:bg-accent">
                <Icons.barChart className="mr-2 h-4 w-4" />
                View Analytics
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, description, icon: Icon, iconColor, iconBg }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
