document.addEventListener('DOMContentLoaded', () => {
    
    let currentDate = new Date(); // Start with today

    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const refreshBtn = document.getElementById('refresh-btn');
    const currentWeekLabel = document.getElementById('current-week-label');
    const scheduleContainer = document.getElementById('schedule-container');
    const loaderContainer = document.getElementById('loader-container');
    const errorContainer = document.getElementById('error-container');
    const emptyContainer = document.getElementById('empty-container');

    // Utility: Format Date to DD-MM-YYYY
    function formatDate(date) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    }

    // Utility: Get Monday of the week
    function getMonday(d) {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    // Utility: Add Days
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    // Capitalize first letter
    function capitalize(s) {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // Map color palette for subjects to make it look nice
    const colors = [
        'bg-blue-50 border-blue-200 text-blue-900',
        'bg-emerald-50 border-emerald-200 text-emerald-900',
        'bg-amber-50 border-amber-200 text-amber-900',
        'bg-purple-50 border-purple-200 text-purple-900',
        'bg-rose-50 border-rose-200 text-rose-900',
        'bg-teal-50 border-teal-200 text-teal-900',
        'bg-indigo-50 border-indigo-200 text-indigo-900'
    ];
    let subjectColorMap = {};
    let colorIndex = 0;

    function getSubjectColorClass(subjectName) {
        if (!subjectColorMap[subjectName]) {
            subjectColorMap[subjectName] = colors[colorIndex % colors.length];
            colorIndex++;
        }
        return subjectColorMap[subjectName];
    }

    async function loadSchedule() {
        const monday = getMonday(currentDate);
        const sunday = addDays(monday, 6);
        
        // Update label
        currentWeekLabel.innerHTML = `<span class="block text-sm text-gray-500 font-normal">Settimana</span>${monday.toLocaleDateString('it-IT')} - ${sunday.toLocaleDateString('it-IT')}`;
        
        scheduleContainer.innerHTML = '';
        errorContainer.classList.add('hidden');
        emptyContainer.classList.add('hidden');
        loaderContainer.classList.remove('hidden');

        try {
            // Build the URL for our Netlify Function (or local equivalent)
            const apiUrl = `/.netlify/functions/api?date=${formatDate(monday)}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            renderSchedule(data.celle || []);
            
        } catch (error) {
            console.error('Error fetching schedule:', error);
            errorContainer.classList.remove('hidden');
        } finally {
            loaderContainer.classList.add('hidden');
        }
    }

    function renderSchedule(events) {
        if (events.length === 0) {
            emptyContainer.classList.remove('hidden');
            return;
        }

        // Group events by Date
        const groupedEvents = {};
        
        events.forEach(event => {
            const dateKey = event.data; // e.g. "03-11-2026"
            if (!groupedEvents[dateKey]) {
                groupedEvents[dateKey] = {
                    fullDateString: event.GiornoCompleto || dateKey,
                    events: []
                };
            }
            groupedEvents[dateKey].events.push(event);
        });

        // Sort dates
        const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
            const dateA = new Date(a.split('-').reverse().join('-'));
            const dateB = new Date(b.split('-').reverse().join('-'));
            return dateA - dateB;
        });

        sortedDates.forEach(dateKey => {
            const group = groupedEvents[dateKey];
            
            // Sort events in this day by start time
            group.events.sort((a, b) => (a.ora_inizio || '').localeCompare(b.ora_inizio || ''));
            
            const dayCard = document.createElement('div');
            dayCard.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100';
            
            // Day Header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'bg-gray-50 border-b border-gray-100 px-6 py-3 font-semibold text-gray-700 text-lg';
            dayHeader.textContent = capitalize(group.fullDateString);
            dayCard.appendChild(dayHeader);

            // Events List
            const eventList = document.createElement('div');
            eventList.className = 'p-4 sm:p-6 space-y-4';
            
            group.events.forEach(evt => {
                const isHoliday = evt.tipo === 'chiusura_type' || !evt.nome_insegnamento;
                
                const eventItem = document.createElement('div');
                
                if (isHoliday) {
                    eventItem.className = 'flex flex-col sm:flex-row rounded-lg border p-4 bg-gray-50 border-gray-200 text-gray-600';
                    const title = (evt.nome || evt.nome_insegnamento || 'Evento senza nome').replace(/<br>/g, ' ');
                    eventItem.innerHTML = `
                        <div class="sm:w-1/4 mb-3 sm:mb-0 sm:pr-4 flex flex-row sm:flex-col justify-start items-center sm:items-start font-bold text-lg border-b sm:border-b-0 sm:border-r border-current border-opacity-20 pb-2 sm:pb-0">
                            <span>Festa</span>
                        </div>
                        <div class="sm:w-3/4 sm:pl-6 flex flex-col justify-center">
                            <h3 class="text-xl font-bold mb-1">${title}</h3>
                        </div>
                    `;
                } else {
                    const colorClasses = getSubjectColorClass(evt.nome_insegnamento);
                    eventItem.className = `flex flex-col sm:flex-row rounded-lg border p-4 ${colorClasses}`;
                    
                    // Time column
                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'sm:w-1/4 mb-3 sm:mb-0 sm:pr-4 flex flex-row sm:flex-col justify-start items-center sm:items-start font-bold text-lg gap-2 sm:gap-0 border-b sm:border-b-0 sm:border-r border-current border-opacity-20 pb-2 sm:pb-0';
                    timeDiv.innerHTML = `
                        <span>${evt.ora_inizio}</span>
                        <span class="text-sm font-normal opacity-75 hidden sm:block">-</span>
                        <span class="sm:hidden text-sm font-normal opacity-75">-</span>
                        <span>${evt.ora_fine}</span>
                    `;
                    
                    // Details column
                    const detailsDiv = document.createElement('div');
                    detailsDiv.className = 'sm:w-3/4 sm:pl-6 flex flex-col justify-center';
                    
                    let typeBadge = '';
                    if(evt.tipo) {
                        typeBadge = `<span class="inline-block px-2 py-1 text-xs font-semibold rounded-md bg-white bg-opacity-50 mb-2 w-max">${evt.tipo}</span>`;
                    }

                    const docente = evt.docente ? evt.docente : 'Nessun docente';
                    const aula = evt.aula ? evt.aula : 'Aula non assegnata';

                    detailsDiv.innerHTML = `
                        ${typeBadge}
                        <h3 class="text-xl font-bold mb-1">${evt.nome_insegnamento}</h3>
                        <p class="opacity-90 font-medium mb-1"><i class="fa-solid fa-user-tie w-5"></i> ${docente}</p>
                        <p class="opacity-90"><i class="fa-solid fa-location-dot w-5"></i> ${aula}</p>
                    `;
                    
                    eventItem.appendChild(timeDiv);
                    eventItem.appendChild(detailsDiv);
                }
                eventList.appendChild(eventItem);
            });
            
            dayCard.appendChild(eventList);
            scheduleContainer.appendChild(dayCard);
        });
    }

    // Event Listeners
    prevWeekBtn.addEventListener('click', () => {
        currentDate = addDays(currentDate, -7);
        loadSchedule();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate = addDays(currentDate, 7);
        loadSchedule();
    });

    refreshBtn.addEventListener('click', () => {
        // Also resets to today if you want, but for now just reloads current viewed week
        loadSchedule();
    });

    // Auto update every 15 minutes
    setInterval(loadSchedule, 15 * 60 * 1000);

    // Initial Load
    loadSchedule();
});
