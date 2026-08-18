// ============================================================
// CALENDAR PLANNER
// ============================================================

let currentDate = new Date();

let schedules = [];

let currentView = "calendar";


// ============================================================
// DOM
// ============================================================

const calendar =
    document.getElementById("calendar");

const monthYear =
    document.getElementById("monthYear");

const modal =
    document.getElementById("eventModal");

const eventForm =
    document.getElementById("eventForm");

const eventId =
    document.getElementById("eventId");

const eventName =
    document.getElementById("eventName");

const eventContent =
    document.getElementById("eventContent");

const eventCategory =
    document.getElementById("eventCategory");

const eventLevel =
    document.getElementById("eventLevel");

const startTime =
    document.getElementById("startTime");

const endTime =
    document.getElementById("endTime");

const deleteBtn =
    document.getElementById("deleteBtn");


// ============================================================
// LOAD EVENTS
// ============================================================

async function loadEvents() {

    try {

        const response =
            await fetch("/schedules");


        if (!response.ok) {

            throw new Error(
                "Could not load schedules"
            );

        }


        schedules =
            await response.json();


        updateStats();

        renderCalendar();

        refreshCurrentView();


    } catch (error) {

        console.error(
            "Load error:",
            error
        );

    }
}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        schedules.length;


    const completed =
        schedules.filter(
            e => Number(e[5]) >= 1
        ).length;


    const today =
        schedules.filter(
            e =>
                e[7] &&
                e[7].startsWith(
                    getDateString(
                        new Date()
                    )
                )
        ).length;


    document.getElementById(
        "totalEvents"
    ).textContent = total;


    document.getElementById(
        "completedEvents"
    ).textContent = completed;


    document.getElementById(
        "todayEvents"
    ).textContent = today;
}


// ============================================================
// CALENDAR
// ============================================================

function renderCalendar() {

    calendar.innerHTML = "";


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    monthYear.textContent =
        currentDate.toLocaleString(
            "default",
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    let startDay =
        firstDay.getDay();


    startDay =
        (startDay + 6) % 7;


    for (
        let i = 0;
        i < startDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "day";

        empty.style.cursor =
            "default";

        calendar.appendChild(
            empty
        );
    }


    for (
        let day = 1;
        day <= lastDay.getDate();
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );

        cell.className =
            "day";


        const number =
            document.createElement(
                "div"
            );

        number.className =
            "day-number";

        number.textContent =
            day;


        cell.appendChild(
            number
        );


        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


        if (
            dateString ===
            getDateString(
                new Date()
            )
        ) {

            cell.classList.add(
                "today"
            );

        }


        const dayEvents =
            schedules.filter(
                event =>
                    event[7] &&
                    event[7].startsWith(
                        dateString
                    )
            );


        dayEvents.forEach(
            event => {

                const eventElement =
                    document.createElement(
                        "div"
                    );


                eventElement.className =
                    `event ${getCategoryClass(
                        event[3]
                    )}`;


                if (
                    Number(event[5]) >= 1
                ) {

                    eventElement.classList.add(
                        "completed"
                    );

                }


                eventElement.textContent =
                    `${event[1]} (${getTime(
                        event[7]
                    )})`;


                eventElement.title =
                    event[1];


                eventElement.onclick =
                    function (e) {

                        e.stopPropagation();

                        openEditEvent(
                            event
                        );

                    };


                cell.appendChild(
                    eventElement
                );

            }
        );


        cell.onclick =
            function () {

                openAddEvent(
                    dateString
                );

            };


        calendar.appendChild(
            cell
        );

    }
}


// ============================================================
// CATEGORY
// ============================================================

function getCategoryClass(
    category
) {

    switch (category) {

        case "Study":
            return "event-study";

        case "Work":
            return "event-work";

        case "Personal":
            return "event-personal";

        default:
            return "event-other";
    }
}


// ============================================================
// ADD EVENT
// ============================================================

function openAddEvent(
    date = null
) {

    eventForm.reset();

    eventId.value = "";

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Event";

    deleteBtn.style.display =
        "none";


    if (date) {

        startTime.value =
            `${date}T09:00`;

        endTime.value =
            `${date}T10:00`;

    } else {

        const now =
            new Date();

        const start =
            new Date(now);

        start.setMinutes(
            Math.ceil(
                start.getMinutes() / 15
            ) * 15
        );

        const end =
            new Date(start);

        end.setHours(
            end.getHours() + 1
        );


        startTime.value =
            formatDateTimeLocal(
                start
            );

        endTime.value =
            formatDateTimeLocal(
                end
            );
    }


    modal.style.display =
        "flex";
}


// ============================================================
// EDIT EVENT
// ============================================================

function openEditEvent(
    event
) {

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Event";


    eventId.value =
        event[0];


    eventName.value =
        event[1] || "";


    eventContent.value =
        event[2] || "";


    eventCategory.value =
        event[3] || "Other";


    eventLevel.value =
        event[4] ?? 0;


    startTime.value =
        convertToDateTimeLocal(
            event[7]
        );


    endTime.value =
        convertToDateTimeLocal(
            event[8]
        );


    deleteBtn.style.display =
        "block";


    modal.style.display =
        "flex";
}


// ============================================================
// SAVE
// ============================================================

eventForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        if (
            new Date(startTime.value) >=
            new Date(endTime.value)
        ) {

            alert(
                "End time must be after start time."
            );

            return;
        }


        const existing =
            schedules.find(
                e =>
                    e[0] ===
                    eventId.value
            );


        const status =
            existing
                ? Number(existing[5])
                : 0;


        const id =
            eventId.value ||
            crypto.randomUUID();


        const data = {

            sid: id,

            name:
                eventName.value.trim(),

            content:
                eventContent.value.trim(),

            category:
                eventCategory.value,

            level:
                Number(
                    eventLevel.value
                ),

            status: status,

            creation_time:
                formatDateTime(
                    new Date()
                ),

            start_time:
                formatDateTimeFromInput(
                    startTime.value
                ),

            end_time:
                formatDateTimeFromInput(
                    endTime.value
                )
        };


        try {

            let response;


            if (eventId.value) {

                response =
                    await fetch(
                        `/schedules/${eventId.value}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );

            } else {

                response =
                    await fetch(
                        "/schedules",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );
            }


            if (!response.ok) {

                console.error(
                    await response.text()
                );

                alert(
                    "Could not save event."
                );

                return;
            }


            closeModal();

            await loadEvents();


        } catch (error) {

            console.error(
                error
            );

            alert(
                "Could not connect to server."
            );

        }

    }
);


// ============================================================
// COMPLETE / UNCOMPLETE
// ============================================================

async function toggleComplete(
    eventIdValue,
    event
) {

    const completed =
        Number(event[5]) >= 1;


    const data = {

        sid: event[0],

        name: event[1],

        content: event[2],

        category: event[3],

        level: Number(event[4]),

        status:
            completed ? 0 : 1,

        creation_time:
            event[6],

        start_time:
            event[7],

        end_time:
            event[8]
    };


    try {

        const response =
            await fetch(
                `/schedules/${eventIdValue}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );


        if (!response.ok) {

            alert(
                "Could not update task."
            );

            return;
        }


        await loadEvents();

    } catch (error) {

        console.error(
            error
        );

    }
}


// ============================================================
// DELETE
// ============================================================

deleteBtn.addEventListener(
    "click",
    async function () {

        if (!eventId.value) {
            return;
        }


        if (
            !confirm(
                "Delete this event?"
            )
        ) {

            return;
        }


        try {

            const response =
                await fetch(
                    `/schedules/${eventId.value}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                alert(
                    "Could not delete event."
                );

                return;
            }


            closeModal();

            await loadEvents();


        } catch (error) {

            console.error(
                error
            );

        }

    }
);


// ============================================================
// MODAL
// ============================================================

function closeModal() {

    modal.style.display =
        "none";
}


document.getElementById(
    "closeModal"
).onclick =
    closeModal;


modal.addEventListener(
    "click",
    function (e) {

        if (
            e.target === modal
        ) {

            closeModal();

        }

    }
);


// ============================================================
// MONTH
// ============================================================

document.getElementById(
    "previousMonth"
).onclick =
    function () {

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        renderCalendar();

    };


document.getElementById(
    "nextMonth"
).onclick =
    function () {

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        renderCalendar();

    };


document.getElementById(
    "todayBtn"
).onclick =
    function () {

        currentDate =
            new Date();

        renderCalendar();

    };


// ============================================================
// NAVIGATION
// ============================================================

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


const views = {

    calendar:
        document.getElementById(
            "calendarView"
        ),

    tasks:
        document.getElementById(
            "tasksView"
        ),

    today:
        document.getElementById(
            "todayView"
        ),

    upcoming:
        document.getElementById(
            "upcomingView"
        ),

    ai:
        document.getElementById(
            "aiView"
        )
};


navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            function () {

                currentView =
                    this.dataset.view;


                navItems.forEach(
                    nav =>
                        nav.classList.remove(
                            "active"
                        )
                );


                this.classList.add(
                    "active"
                );


                Object.values(
                    views
                ).forEach(
                    view =>
                        view.style.display =
                            "none"
                );


                views[
                    currentView
                ].style.display =
                    "block";


                refreshCurrentView();

            }
        );

    }
);


// ============================================================
// CURRENT VIEW
// ============================================================

function refreshCurrentView() {

    if (
        currentView ===
        "calendar"
    ) {

        renderCalendar();

    }


    if (
        currentView ===
        "tasks"
    ) {

        renderTasks();

    }


    if (
        currentView ===
        "today"
    ) {

        renderToday();

    }


    if (
        currentView ===
        "upcoming"
    ) {

        renderUpcoming();

    }

}


// ============================================================
// TASK FILTERS
// ============================================================

document.getElementById(
    "taskSearch"
).addEventListener(
    "input",
    renderTasks
);


document.getElementById(
    "categoryFilter"
).addEventListener(
    "change",
    renderTasks
);


document.getElementById(
    "statusFilter"
).addEventListener(
    "change",
    renderTasks
);


// ============================================================
// TASKS
// ============================================================

function renderTasks() {

    const container =
        document.getElementById(
            "tasksList"
        );


    const search =
        document.getElementById(
            "taskSearch"
        ).value
        .toLowerCase()
        .trim();


    const category =
        document.getElementById(
            "categoryFilter"
        ).value;


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    let filtered =
        [...schedules];


    // Search

    if (search) {

        filtered =
            filtered.filter(
                event =>
                    String(
                        event[1]
                    )
                    .toLowerCase()
                    .includes(search)
                    ||
                    String(
                        event[2]
                    )
                    .toLowerCase()
                    .includes(search)
            );

    }


    // Category

    if (
        category !==
        "all"
    ) {

        filtered =
            filtered.filter(
                event =>
                    event[3] ===
                    category
            );

    }


    // Status

    if (
        status ===
        "completed"
    ) {

        filtered =
            filtered.filter(
                event =>
                    Number(event[5]) >= 1
            );

    }


    if (
        status ===
        "pending"
    ) {

        filtered =
            filtered.filter(
                event =>
                    Number(event[5]) < 1
            );

    }


    if (
        status ===
        "overdue"
    ) {

        filtered =
            filtered.filter(
                event =>
                    isOverdue(event)
            );

    }


    filtered.sort(
        (a, b) =>
            parseDate(a[7]) -
            parseDate(b[7])
    );


    if (
        filtered.length ===
        0
    ) {

        container.innerHTML =
            `
            <div class="empty-state">
                No matching tasks.
            </div>
            `;

        updateProgress();

        return;
    }


    container.innerHTML =
        "";


    filtered.forEach(
        event => {

            container.appendChild(
                createTaskCard(
                    event
                )
            );

        }
    );


    updateProgress();
}


// ============================================================
// TASK CARD
// ============================================================

function createTaskCard(
    event
) {

    const card =
        document.createElement(
            "div"
        );


    const completed =
        Number(event[5]) >= 1;


    const overdue =
        isOverdue(event);


    const priority =
        getPriorityText(
            event[4]
        );


    const category =
        event[3] ||
        "Other";


    const start =
        parseDate(
            event[7]
        );


    const dateText =
        start.toLocaleDateString(
            "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric"
            }
        );


    const timeText =
        start.toLocaleTimeString(
            "en-US",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    card.className =
        "task-card";


    if (completed) {

        card.classList.add(
            "task-completed"
        );

    }


    card.innerHTML =
        `
        <div class="task-left">

            <button
                class="complete-btn ${
                    completed
                        ? "completed"
                        : ""
                }"
                title="${
                    completed
                        ? "Mark incomplete"
                        : "Mark complete"
                }">

                ${
                    completed
                        ? "✓"
                        : ""
                }

            </button>


            <span
                class="task-dot ${getCategoryClass(
                    category
                ).replace(
                    "event-",
                    ""
                )}">
            </span>


            <div class="task-info">

                <h3>
                    ${escapeHtml(
                        event[1]
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        category
                    )}
                    •
                    ${dateText}

                    ${
                        overdue &&
                        !completed
                            ? `<span class="overdue">
                                • OVERDUE
                               </span>`
                            : ""
                    }
                </p>

            </div>

        </div>


        <div>

            ${
                priority
                    ? `
                    <span
                        class="priority ${
                            priority.className
                        }">
                        ${priority.text}
                    </span>
                    `
                    : ""
            }

            <div class="task-time">
                ${timeText}
            </div>

        </div>
        `;


    const completeButton =
        card.querySelector(
            ".complete-btn"
        );


    completeButton.onclick =
        async function (e) {

            e.stopPropagation();

            await toggleComplete(
                event[0],
                event
            );

        };


    card.onclick =
        function () {

            openEditEvent(
                event
            );

        };


    return card;
}


// ============================================================
// PRIORITY
// ============================================================

function getPriorityText(
    level
) {

    switch (
        Number(level)
    ) {

        case 3:
            return {
                text: "HIGH",
                className:
                    "priority-high"
            };

        case 2:
            return {
                text: "MEDIUM",
                className:
                    "priority-medium"
            };

        case 1:
            return {
                text: "LOW",
                className:
                    "priority-low"
            };

        default:
            return null;
    }
}


// ============================================================
// TODAY
// ============================================================

function renderToday() {

    const container =
        document.getElementById(
            "todayList"
        );


    const today =
        new Date();


    document.getElementById(
        "todayDate"
    ).textContent =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    const todayString =
        getDateString(
            today
        );


    const todayEvents =
        schedules
            .filter(
                event =>
                    event[7] &&
                    event[7].startsWith(
                        todayString
                    )
            )
            .sort(
                (a, b) =>
                    parseDate(a[7]) -
                    parseDate(b[7])
            );


    const completed =
        todayEvents.filter(
            e =>
                Number(e[5]) >= 1
        ).length;


    document.getElementById(
        "todayTotal"
    ).textContent =
        todayEvents.length;


    document.getElementById(
        "todayCompleted"
    ).textContent =
        completed;


    document.getElementById(
        "todayRemaining"
    ).textContent =
        todayEvents.length -
        completed;


    if (
        todayEvents.length ===
        0
    ) {

        container.innerHTML =
            `
            <div class="empty-state">
                🎉 Nothing scheduled for today.
            </div>
            `;

        return;
    }


    container.innerHTML =
        "";


    todayEvents.forEach(
        event => {

            container.appendChild(
                createTaskCard(
                    event
                )
            );

        }
    );
}


// ============================================================
// UPCOMING
// ============================================================

function renderUpcoming() {

    const container =
        document.getElementById(
            "upcomingList"
        );


    const now =
        new Date();


    const upcoming =
        schedules
            .filter(
                event =>
                    event[7] &&
                    parseDate(
                        event[7]
                    ) >= now
            )
            .sort(
                (a, b) =>
                    parseDate(a[7]) -
                    parseDate(b[7])
            );


    if (
        upcoming.length ===
        0
    ) {

        container.innerHTML =
            `
            <div class="empty-state">
                No upcoming events.
            </div>
            `;

        return;
    }


    container.innerHTML =
        "";


    upcoming.forEach(
        event => {

            container.appendChild(
                createTaskCard(
                    event
                )
            );

        }
    );
}


// ============================================================
// PROGRESS
// ============================================================

function updateProgress() {

    const total =
        schedules.length;


    const completed =
        schedules.filter(
            event =>
                Number(event[5]) >= 1
        ).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );


    document.getElementById(
        "progressText"
    ).textContent =
        `${percentage}%`;


    document.getElementById(
        "progressFill"
    ).style.width =
        `${percentage}%`;


    document.getElementById(
        "streakText"
    ).textContent =
        `🔥 ${calculateStreak()} day streak`;
}


// ============================================================
// STREAK
// ============================================================

function calculateStreak() {

    const completedDates =
        new Set();


    schedules.forEach(
        event => {

            if (
                Number(event[5]) >= 1 &&
                event[7]
            ) {

                completedDates.add(
                    event[7].substring(
                        0,
                        10
                    )
                );

            }

        }
    );


    let streak = 0;

    const date =
        new Date();


    // If nothing completed today,
    // start checking from yesterday.

    if (
        !completedDates.has(
            getDateString(date)
        )
    ) {

        date.setDate(
            date.getDate() - 1
        );

    }


    while (
        completedDates.has(
            getDateString(date)
        )
    ) {

        streak++;

        date.setDate(
            date.getDate() - 1
        );

    }


    return streak;
}


// ============================================================
// OVERDUE
// ============================================================

function isOverdue(
    event
) {

    if (
        Number(event[5]) >= 1
    ) {

        return false;
    }


    return (
        parseDate(
            event[8]
        ) < new Date()
    );
}


// ============================================================
// AI PLANNER
// ============================================================

document.getElementById(
    "generatePlanBtn"
).addEventListener(
    "click",
    generateAIPlan
);


async function generateAIPlan() {

    const prompt =
        document.getElementById(
            "aiPrompt"
        ).value.trim();


    if (!prompt) {

        alert(
            "Tell the AI what you need to plan."
        );

        return;
    }


    const button =
        document.getElementById(
            "generatePlanBtn"
        );


    const loading =
        document.getElementById(
            "aiLoading"
        );


    const result =
        document.getElementById(
            "aiResult"
        );


    button.disabled =
        true;


    loading.style.display =
        "block";


    result.innerHTML =
        "";


    try {

        const response =
            await fetch(
                "/ai/plan",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            prompt:
                                prompt
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "AI planner failed"
            );

        }


        displayAIPlan(
            data
        );


    } catch (error) {

        console.error(
            error
        );


        result.innerHTML =
            `
            <div class="empty-state">
                ❌ ${escapeHtml(
                    error.message
                )}
            </div>
            `;

    } finally {

        button.disabled =
            false;

        loading.style.display =
            "none";

    }
}


// ============================================================
// DISPLAY AI PLAN
// ============================================================

function displayAIPlan(
    data
) {

    const result =
        document.getElementById(
            "aiResult"
        );


    if (
        !data.sessions ||
        data.sessions.length ===
        0
    ) {

        result.innerHTML =
            `
            <div class="empty-state">
                AI couldn't create any sessions.
            </div>
            `;

        return;
    }


    let html =
        `
        <h3>
            ✨ Suggested Plan
        </h3>

        <p>
            ${escapeHtml(
                data.summary || ""
            )}
        </p>
        `;


    data.sessions.forEach(
        session => {

            html +=
                `
                <div class="ai-plan-item">

                    <strong>
                        ${escapeHtml(
                            session.title
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            session.date
                        )}
                        •
                        ${escapeHtml(
                            session.start_time
                        )}
                        -
                        ${escapeHtml(
                            session.end_time
                        )}
                        •
                        ${escapeHtml(
                            session.category ||
                            "Study"
                        )}
                    </span>

                </div>
                `;

        }
    );


    html +=
        `
        <button
            class="generate-btn"
            onclick="addAIPlanToCalendar()">

            Add Plan to Calendar

        </button>
        `;


    result.innerHTML =
        html;


    window.latestAIPlan =
        data.sessions;
}


// ============================================================
// ADD AI PLAN TO CALENDAR
// ============================================================

async function addAIPlanToCalendar() {

    if (
        !window.latestAIPlan ||
        window.latestAIPlan.length === 0
    ) {

        return;
    }


    for (
        const session
        of window.latestAIPlan
    ) {

        const start =
            `${session.date} ${session.start_time}:00`;


        const end =
            `${session.date} ${session.end_time}:00`;


        const data = {

            sid:
                crypto.randomUUID(),

            name:
                session.title,

            content:
                session.description ||
                "Created by AI Planner",

            category:
                session.category ||
                "Study",

            level:
                Number(
                    session.level ||
                    2
                ),

            status: 0,

            creation_time:
                formatDateTime(
                    new Date()
                ),

            start_time:
                start,

            end_time:
                end
        };


        try {

            await fetch(
                "/schedules",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        } catch (error) {

            console.error(
                error
            );

        }
    }


    await loadEvents();


    alert(
        "✨ AI plan added to your calendar!"
    );


    currentView =
        "calendar";


    navItems.forEach(
        nav =>
            nav.classList.remove(
                "active"
            )
    );


    document
        .querySelector(
            '[data-view="calendar"]'
        )
        .classList.add(
            "active"
        );


    Object.values(
        views
    ).forEach(
        view =>
            view.style.display =
                "none"
    );


    views.calendar.style.display =
        "block";


    renderCalendar();
}


// ============================================================
// DATE HELPERS
// ============================================================

function getDateString(
    date
) {

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(
        2,
        "0"
    )}-${String(
        date.getDate()
    ).padStart(
        2,
        "0"
    )}`;
}


function formatDateTime(
    date
) {

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(
        2,
        "0"
    )}-${String(
        date.getDate()
    ).padStart(
        2,
        "0"
    )} ${String(
        date.getHours()
    ).padStart(
        2,
        "0"
    )}:${String(
        date.getMinutes()
    ).padStart(
        2,
        "0"
    )}:${String(
        date.getSeconds()
    ).padStart(
        2,
        "0"
    )}`;
}


function formatDateTimeLocal(
    date
) {

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(
        2,
        "0"
    )}-${String(
        date.getDate()
    ).padStart(
        2,
        "0"
    )}T${String(
        date.getHours()
    ).padStart(
        2,
        "0"
    )}:${String(
        date.getMinutes()
    ).padStart(
        2,
        "0"
    )}`;
}


function formatDateTimeFromInput(
    value
) {

    return value.replace(
        "T",
        " "
    ) + ":00";
}


function convertToDateTimeLocal(
    value
) {

    if (!value) {
        return "";
    }


    return value
        .replace(
            " ",
            "T"
        )
        .substring(
            0,
            16
        );
}


function getTime(
    value
) {

    return value
        ? value.substring(
            11,
            16
        )
        : "";
}


function parseDate(
    value
) {

    if (!value) {
        return new Date();
    }


    return new Date(
        value.replace(
            " ",
            "T"
        )
    );
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


// ============================================================
// INITIALIZE
// ============================================================

loadEvents();