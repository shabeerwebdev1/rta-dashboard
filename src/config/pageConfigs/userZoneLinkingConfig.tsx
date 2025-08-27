import { PageConfig } from "../../types/config";


export const UserZoneLinkingConfig: PageConfig = {

      title: "Zone Linking",

    tableConfig: {
        columns:[
            { key: "employeeId", title: "employeeId", type:"string", sortable:true},
            { key: "employeeName", title: "employeeName", type:"string", sortable:true},
            { key: "zone", title: "zone", type:"string", sortable:false},
            { key: "weekOffs", title: "weekOffs", type:"string", sortable:false},

        ]
    }

}