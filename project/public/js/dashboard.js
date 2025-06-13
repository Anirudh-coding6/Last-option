const API_BASE_URL = 'http://localhost:3000/api';
let providerData = null;
let currentLeads = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    updateCurrentDate();
});

function checkAuthentication() {
    const token = localStorage.getItem('providerToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Verify token and get provider data
    fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.type === 'provider') {
            providerData = data.user;
            updateProviderInfo();
            loadDashboardData();
        } else {
            localStorage.removeItem('providerToken');
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Authentication error:', error);
        localStorage.removeItem('providerToken');
        window.location.href = '/';
    });
}

function updateProviderInfo() {
    if (providerData) {
        document.querySelector('.sidebar h6').textContent = providerData.businessName;
        document.querySelector('.sidebar small').textContent = 'Service Provider';
    }
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('providerToken');
        
        // Load analytics data
        const analyticsResponse = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            updateDashboardStats(analytics);
        }

        // Load leads data
        const leadsResponse = await fetch(`${API_BASE_URL}/leads?limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            currentLeads = leadsData.leads;
            loadRecentLeads();
            loadLeadsList();
        }

        // Load appointments data
        loadTodaySchedule();
        loadJobsList();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(analytics) {
    document.getElementById('newLeadsCount').textContent = analytics.overview.newLeads;
    document.getElementById('activeJobsCount').textContent = analytics.overview.activeAppointments;
    document.getElementById('monthlyRevenue').textContent = `$${analytics.overview.monthlyRevenue.toLocaleString()}`;
    document.getElementById('rating').textContent = analytics.rating;
}

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function loadRecentLeads() {
    const container = document.getElementById('recentLeadsList');
    const recentLeads = currentLeads.slice(0, 3);
    
    if (recentLeads.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <p class="text-muted">No leads yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentLeads.map(lead => `
        <div class="card lead-card lead-${lead.status} mb-2">
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${lead.name}</h6>
                        <small class="text-muted">${lead.serviceType} - ${lead.message || 'No message'}</small>
                    </div>
                    <div class="text-end">
                        <small class="text-muted">${new Date(lead.createdAt).toLocaleDateString()}</small>
                        <br>
                        <span class="badge bg-${getStatusColor(lead.status)}">${lead.status}</span>
                        <span class="badge bg-${getScoreColor(lead.category)} ms-1">${lead.category}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadTodaySchedule() {
    const container = document.getElementById('todaySchedule');
    
    // Placeholder data - in real app, this would come from appointments API
    container.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-calendar fa-2x text-muted mb-3"></i>
            <p class="text-muted">No appointments scheduled for today</p>
        </div>
    `;
}

function loadLeadsList() {
    const container = document.getElementById('leadsList');
    
    if (currentLeads.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-users fa-4x text-muted mb-3"></i>
                <h4 class="text-muted">No Leads Yet</h4>
                <p class="text-muted">Leads will appear here when customers submit service requests</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentLeads.map(lead => `
        <div class="card lead-card lead-${lead.status} mb-3" data-status="${lead.status}">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center mb-2">
                            <h5 class="mb-0 me-3">${lead.name}</h5>
                            <span class="badge bg-${getScoreColor(lead.category)}">${lead.category.toUpperCase()}</span>
                            <span class="badge bg-secondary ms-2">Score: ${lead.score}</span>
                        </div>
                        <p class="mb-1"><strong>Service:</strong> ${lead.serviceType}</p>
                        <p class="mb-1">${lead.message || 'No additional details provided'}</p>
                        <small class="text-muted">
                            <i class="fas fa-envelope me-1"></i>${lead.email} | 
                            <i class="fas fa-phone me-1"></i>${lead.phone}
                        </small>
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="badge bg-${getStatusColor(lead.status)} mb-2">${lead.status}</span>
                        <div class="small text-muted mb-2">
                            ${new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="contactLead('${lead._id}')" title="Contact">
                                <i class="fas fa-phone"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="updateLeadStatus('${lead._id}')" title="Update Status">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="viewLead('${lead._id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadJobsList() {
    const container = document.getElementById('jobsList');
    
    // Placeholder for jobs - in real app, this would come from appointments API
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-briefcase fa-4x text-muted mb-3"></i>
            <h4 class="text-muted">No Active Jobs</h4>
            <p class="text-muted">Active jobs and appointments will appear here</p>
        </div>
    `;
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'contacted': 'info',
        'qualified': 'success',
        'converted': 'primary',
        'closed': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getScoreColor(category) {
    const colors = {
        'hot': 'danger',
        'warm': 'warning',
        'cold': 'info'
    };
    return colors[category] || 'secondary';
}

function filterLeads(status) {
    const cards = document.querySelectorAll('#leadsList .lead-card');
    const buttons = document.querySelectorAll('.btn-group button');
    
    // Update active button
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter cards
    cards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Action functions
async function refreshLeads() {
    const btn = event.target;
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    
    try {
        await loadDashboardData();
    } catch (error) {
        console.error('Error refreshing leads:', error);
    } finally {
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 1000);
    }
}

async function contactLead(id) {
    try {
        const token = localStorage.getItem('providerToken');
        const response = await fetch(`${API_BASE_URL}/leads/${id}/interactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'call',
                description: 'Contacted lead via phone'
            })
        });
        
        if (response.ok) {
            alert('Lead contact recorded successfully!');
            loadDashboardData(); // Refresh data
        } else {
            throw new Error('Failed to record contact');
        }
    } catch (error) {
        console.error('Error contacting lead:', error);
        alert('Error recording contact. Please try again.');
    }
}

async function updateLeadStatus(id) {
    const newStatus = prompt('Enter new status (pending, contacted, qualified, converted, closed):');
    if (!newStatus) return;
    
    const validStatuses = ['pending', 'contacted', 'qualified', 'converted', 'closed'];
    if (!validStatuses.includes(newStatus)) {
        alert('Invalid status. Please use: pending, contacted, qualified, converted, or closed');
        return;
    }
    
    try {
        const token = localStorage.getItem('providerToken');
        const response = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                notes: `Status updated to ${newStatus}`
            })
        });
        
        if (response.ok) {
            alert('Lead status updated successfully!');
            loadDashboardData(); // Refresh data
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating lead status:', error);
        alert('Error updating status. Please try again.');
    }
}

function viewLead(id) {
    const lead = currentLeads.find(l => l._id === id);
    if (lead) {
        alert(`Lead Details:\n\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nService: ${lead.serviceType}\nStatus: ${lead.status}\nScore: ${lead.score} (${lead.category})\nMessage: ${lead.message || 'No message'}`);
    }
}

function addNewJob() {
    alert('Add new job functionality would be implemented here');
}

function viewJob(id) {
    alert(`Viewing job ${id}...`);
}

function updateJob(id) {
    alert(`Updating job ${id}...`);
}

function addAppointment() {
    alert('Add appointment functionality would be implemented here');
}

function editProfile() {
    alert('Edit profile functionality would be implemented here');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('providerToken');
        window.location.href = '/';
    }
}