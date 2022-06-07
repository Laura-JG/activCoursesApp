const WEEKDAYS = {
    MONDAY: { name: "Monday", dayNumber: 1 },
    TUESDAY: { name: "Tuesday", dayNumber: 2 },
    WEDNESDAY: { name: "Wednesday", dayNumber: 3 },
    THURSDAY: { name: "Thursday", dayNumber: 4 },
    FRIDAY: { name: "Friday", dayNumber: 5 },
    SATURDAY: { name: "Saturday", dayNumber: 6 },
    SUNDAY: { name: "Sunday", dayNumber: 7 }
}
const PERIODS = {
    MORNING: { name: "Morning", id: 1 },
    NOON: { name: "Noon", id: 2 },
    AFTERNOON: { name: "Afternoon", id: 3 },
    EVENING: { name: "Evening", id: 4  }
}
const GYMS_GE = {
    ACACIAS: { name: "ACTIV FITNESS Acacias", id: 159 },
    ALPES: { name: "ACTIV FITNESS Genève Alpes", id: 160 },
    BALEXERT: { name: "ACTIV FITNESS Genève Balexert", id: 154 },
    CHARMILLES: { name: "ACTIV FITNESS Genève Charmilles", id: 161 },
    CYGNES: { name: "ACTIV FITNESS Genève Cygnes", id: 31 },
    EAUX_VIVES : { name: "ACTIV FITNESS Genève Eaux-Vives", id: 157 },
    ICC: { name: "ACTIV FITNESS Genève ICC", id: 163 },
    MAUNOIR : { name: "ACTIV FITNESS Genève Maunoir", id: 164 },
    PETIT_LANCY : { name: "ACTIV FITNESS Petit-Lancy", id: 165 },
    PLAN_LES_OUATES : { name: "ACTIV FITNESS Plan-les-Ouates", id: 169 },
    PONT_ROUGE : { name: "ACTIV FITNESS Lancy Pont Rouge", id: 156 },
    RHONE : { name: "ACTIV FITNESS Genève Rhône", id: 52 },
    THONEX : { name: "ACTIV FITNESS Thônex", id: 162 },
    VERMONT: { name: "ACTIV FITNESS Genève Vermont", id: 166 }
}

const getInitBody = () => {
    return body = {
        language: "fr",
        skip: 0,
        take: 100,
        selectMethod: 2,
        memberIdTac: 0,
        centerIds: Object.entries(GYMS_GE).map(([k, v]) => v.id),
        daytimeIds: Object.entries(PERIODS).map(([k, v]) => v.id),
        weekdayIds: Object.entries(WEEKDAYS).map(([k, v]) => v.dayNumber),
        coursetitles: []
    };
}

const getCfgBody = (availability, configuration) => {
    return body = {
        language: "fr",
        skip: configuration.timeRange.nDaysToSkip,
        take: configuration.timeRange.nDaysSpan,
        selectMethod: 2,
        memberIdTac: 0,
        centerIds: availability.gyms.map(gym => gym.id),
        daytimeIds: availability.periods.map(period => period.id),
        weekdayIds: availability.days.map(day => day.dayNumber),
        coursetitles: []
    };
}

const filterCourses = (courses, desiredActivities, availabilityPeriods) => {

    const activityIds = desiredActivities.map(activity => activity.id);

    const filtered = courses.filter(course => {

        const activityCondition = activityIds.includes(course.title)

        const timeCondition = availabilityPeriods.map(period => {
            //course.start is the same day as course end so it's okay
            const {startDate: periodStartDatetime, endDate: periodEndDatetime} = period.genDatetimesFromDate(course.start);
            return (course.start >= periodStartDatetime) && (course.end <= periodEndDatetime);
        }).some(e => e);

        return activityCondition && timeCondition ;
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

class Activity {
    id = null;
    name = null;
    duration = null;

    constructor(id) {
        this.id = id;
        const splat = id.split(' ');
        this.duration = splat.slice(0, -1).join(' ');
        this.name = splat.at(-1);
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
            gyms: [GYMS_GE.BALEXERT, GYMS_GE.CHARMILLES, GYMS_GE.ICC, GYMS_GE.VERMONT],
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
            gyms: [GYMS_GE.BALEXERT, GYMS_GE.CHARMILLES, GYMS_GE.ICC, GYMS_GE.VERMONT, GYMS_GE.ALPES, GYMS_GE.CYGNES],
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
            gyms: [GYMS_GE.BALEXERT, GYMS_GE.CHARMILLES, GYMS_GE.ICC, GYMS_GE.VERMONT],
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
    timeRange = {
        nDaysToSkip: 0,
        nDaysSpan: 8
    }
    constructor(){}
}

class ActivFitnessClient {
    static scheduledCoursesEndpoint = "/scheduledCourses";
    static geCourseTitlesEndpoint = "/geCourseTitles";
    static getGECoursesNames = async (body) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-type':'application/json',
                'Accept':'application/json'
            },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(ActivFitnessClient.geCourseTitlesEndpoint, options);
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
    static getScheduledCourses = async (body) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-type':'application/json',
                'Accept':'application/json'
            },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(ActivFitnessClient.scheduledCoursesEndpoint, options);
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
