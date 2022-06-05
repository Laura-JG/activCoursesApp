const WEEKDAYS = {
    MONDAY: { name: "Monday", dayNumber: 1 },
    TUESDAY: { name: "Tuesday", dayNumber: 2 },
    WEDNESDAY: { name: "Wednesday", dayNumber: 3 },
    THURSDAY: { name: "Thursday", dayNumber: 4 },
    FRIDAY: { name: "Friday", dayNumber: 5 },
    SATURDAY: { name: "Saturday", dayNumber: 6 },
    SUNDAY: { name: "Sunday", dayNumber: 0 }
}
const PERIODS = {
    MORNING: { name: "Morning", id: 1 },
    NOON: { name: "Noon", id: 2 },
    AFTERNOON: { name: "Afternoon", id: 3 },
    EVENING: { name: "Evening", id: 4  }
}
const GYMS = {
    BALEXERT: { name: "ACTIV FITNESS Genève Balexert", id: 154 },
    CHARMILLES: { name: "ACTIV FITNESS Genève Charmilles", id: 161 },
    ICC: { name: "ACTIV FITNESS Genève ICC", id: 163 },
    VERMONT: { name: "ACTIV FITNESS Genève Vermont", id: 166 },
    ALPES: { name: "ACTIV FITNESS Genève Alpes", id: 160 },
    CYGNES: { name: "ACTIV FITNESS Genève Cygnes", id: 31 }
}

const getBodyFromAvailability = (availability) => {

    const body = {
                language: "fr",
                skip: 0, // Number of days skipped
                take: 8, // Number of days to look ahead, including today, max 21. 0 = all possible
                selectMethod: 2,
                memberIdTac: 0,
                centerIds: availability.gyms.map(gym => gym.id),
                daytimeIds: availability.periods.map(period => period.id),
                weekdayIds: availability.days.map(day => day.dayNumber),
                coursetitles: []
            };
    return body;
}

const filterCoursesFromConfig = (courses, desiredActivities, availabilityPeriods) => {

    const activityNames = desiredActivities.map(activity => activity.name);

    const filtered = courses.filter(course => {

        const courseCondition = activityNames.includes(course.title)

        const timeCondition = availabilityPeriods.map(period => {
            //course.start is the same day as course end so it's okay
            const {startDate: periodStartDatetime, endDate: periodEndDatetime} = period.genDatetimesFromDate(course.start);
            return (course.start >= periodStartDatetime) && (course.end <= periodEndDatetime);
        }).some(e => e);

        return courseCondition && timeCondition ;
    });

    return filtered;

}

class Gym {
    id = null;
    name = null;
    availableActivities = [];
    location = null;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Unnecessary?
class Activity {
    name = null;

    constructor(name) {
        this.name = name;
    }
}
class AvailableActivity extends Activity {
    timeFrame = null;
    constructor(name, timeFrame) {
        super(id, name);
        this.timeFrame = timeFrame;
    }

}

class TimedPeriod {
    name = null;
    id = null;
    startTime = null;
    endTime = null;
    constructor(definedPeriod){
        this.name = definedPeriod.period.name;
        this.id = definedPeriod.period.id;
        this.startTime = definedPeriod.startTime;
        this.endTime = definedPeriod.endTime;
    }
    #genDatetimeFromDate(date, refTime) {
        const refDate = new Date(date);
        const tokens = refTime.split(':').map(t => parseInt(t))
        refDate.setHours(tokens[0], tokens[1], 0);
        return refDate;
    }
    genDatetimesFromDate(date) {
        return {
            startDate: this.#genDatetimeFromDate(date, this.startTime),
            endDate: this.#genDatetimeFromDate(date, this.endTime)
        }
    }
    setId(id){
        this.id = id
    }
    
}

class ActivFitnessConfiguration {
    id = "default";
    periodDefinitions = {
        morning: {
            period: PERIODS.MORNING,
            startTime: '08:00',
            endTime: '12:00'
        },
        noon: {
            period: PERIODS.NOON,
            startTime: '12:00',
            endTime: '14:00'
        },
        afternoon: {
            period: PERIODS.AFTERNOON,
            startTime: '14:00',
            endTime: '18:30'
        },
        evening: {
            period: PERIODS.EVENING,
            startTime: '18:30',
            endTime: '22:00'
        }
    };
    availabilities=[
        {
            name: "Week days - home",
            gyms: [GYMS.BALEXERT, GYMS.CHARMILLES, GYMS.ICC, GYMS.VERMONT],
            days: [
                WEEKDAYS.MONDAY,
                WEEKDAYS.TUESDAY,
                WEEKDAYS.FRIDAY
            ],
            periods: [
                new TimedPeriod(this.periodDefinitions.noon),
                new TimedPeriod(this.periodDefinitions.evening)
            ]
        },
        {
            name: "Week days - office",
            gyms: [GYMS.BALEXERT, GYMS.CHARMILLES, GYMS.ICC, GYMS.VERMONT, GYMS.ALPES, GYMS.CYGNES],
            days: [
                WEEKDAYS.WEDNESDAY,
                WEEKDAYS.THURSDAY
            ],
            periods: [
                new TimedPeriod(this.periodDefinitions.evening)
            ]
        },
        {
            name: "Week-end",
            gyms: [GYMS.BALEXERT, GYMS.CHARMILLES, GYMS.ICC, GYMS.VERMONT],
            days: [
                WEEKDAYS.SATURDAY,
                WEEKDAYS.SUNDAY
            ],
            periods: [
                new TimedPeriod(this.periodDefinitions.morning),
                new TimedPeriod(this.periodDefinitions.noon),
                new TimedPeriod(this.periodDefinitions.afternoon),
                new TimedPeriod(this.periodDefinitions.evening)
            ]
        }
    ];
    desiredActivities=[
        new Activity("Stretching 30'"),
        new Activity("Stretching 55'"),
        new Activity("Bodytoning 55'"),
        new Activity("Les Mills CORE® 25'"),
        new Activity("Les Mills CORE® 45'"),
        new Activity("BODYSTEP® 55'")
    ];
    constructor(){}
}

class ActivFitnessClient {
    static endpoint = "/courses";
    static getCourses = async (body) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-type':'application/json',
                'Accept':'application/json'
            },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(ActivFitnessClient.endpoint, options);
            if(!response){
                throw {
                    errorCode: response.status,
                    message: response.statusText
                }
            }
            const json = await response.json()
            return json;
        } catch (e) {
            console.error("[getCourses] cannnot get courses",e);
        }
    }
}
