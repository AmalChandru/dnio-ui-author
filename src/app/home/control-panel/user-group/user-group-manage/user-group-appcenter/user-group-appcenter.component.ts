import { Component, OnInit, Input } from '@angular/core';
import { CommonService, GetOptions } from 'src/app/utils/services/common.service';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
    selector: 'odp-user-group-appcenter',
    templateUrl: './user-group-appcenter.component.html',
    styleUrls: ['./user-group-appcenter.component.scss']
})
export class UserGroupAppcenterComponent implements OnInit {

    @Input() roles: Array<any>;
    serviceList: Array<any>;
    toggleAccordion: any;
    subscriptions: any;
    aggregatePermission: any;
    activeSubTab: number;
    showLazyLoader:boolean;

    constructor(private commonService: CommonService,
        private appService: AppService) {
        const self = this;
        self.serviceList = [];
        self.toggleAccordion = {};
        self.aggregatePermission = {};
        self.subscriptions = {};
        self.roles = [];
        self.activeSubTab = 0;
        self.showLazyLoader=false;
    }

    ngOnInit() {
        const self = this;
        self.getServiceList();
        if (self.hasPermission('PVGCDS') || self.hasPermission('PMGCDS')) {
            self.activeSubTab = 0;
        } else if (self.hasPermission('PVGCI') || self.hasPermission('PMGCI')) {
            self.activeSubTab = 1;
        } else if (self.hasPermission('PVGCBM') || self.hasPermission('PMGCBM')) {
            self.activeSubTab = 2;
        }
    }


    onChange(roles: any) {
        const self = this;
    }

    getServiceList() {
        
        const self = this;
        self.showLazyLoader=true;
        const options: GetOptions = {
            count: -1,
            select: 'entity,entityName,roles,type,app',
            filter: {
                type: 'appcenter'
            }
        };
        self.subscriptions['getServiceList'] = self.commonService.get('user', '/role', options).subscribe(res => {
            self.serviceList = res;
            self.serviceList.forEach(srvc => {
                if (srvc.roles) {
                    srvc.roles.forEach(role => {
                        role.app = srvc.app;
                        role.entity = srvc.entity;
                    });
                }
                self.calculatePermission(srvc);
            });
            self.showLazyLoader =false;
        }, err => {
            self.commonService.errorToast(err, 'Unable to fetch services, please try again later');
        });
    }

    calculatePermission(service: any) {
        const self = this;
        self.aggregatePermission[service.entity] = {
            total: 'no'
        };
        const temp = self.roles
            .filter(r => r.entity === service.entity && r.app === service.app)
            .map(r => service.roles.find(e => e.id === r.id))
            .filter(r => r);
        if (temp && temp.length > 0) {
            if (temp.find(r => r.operations.find(e => e.method === 'POST'
                || e.method === 'PUT'
                || e.method === 'DELETE'
                || e.method === 'REVIEW'
                || e.method === 'SKIP_REVIEW'))) {
                self.aggregatePermission[service.entity]['total'] = 'manage';
                if (temp.find(r => r.operations.find(e => e.method === 'POST'))) {
                    self.aggregatePermission[service.entity]['POST'] = true;
                }
                if (temp.find(r => r.operations.find(e => e.method === 'PUT'))) {
                    self.aggregatePermission[service.entity]['PUT'] = true;
                }
                if (temp.find(r => r.operations.find(e => e.method === 'DELETE'))) {
                    self.aggregatePermission[service.entity]['DELETE'] = true;
                }
                if (temp.find(r => r.operations.find(e => e.method === 'REVIEW'))) {
                    self.aggregatePermission[service.entity]['REVIEW'] = true;
                }
                if (temp.find(r => r.operations.find(e => e.method === 'SKIP_REVIEW'))) {
                    self.aggregatePermission[service.entity]['SKIP_REVIEW'] = true;
                }
            } else {
                self.aggregatePermission[service.entity]['total'] = 'view';
            }
        } else {
            self.aggregatePermission[service.entity]['total'] = 'no';
        }
    }

    hasManage(role: any) {
        if (role.operations.find(e => e.method === 'POST'
            || e.method === 'PUT'
            || e.method === 'DELETE'
            || e.method === 'SKIP_REVIEW'
            || e.method === 'REVIEW')) {
            return true;
        }
        return false;
    }
    hasMethod(role: any, method: string) {
        if (role.operations.find(e => e.method === method)) {
            return true;
        }
        return false;
    }

    roleActive(role: any) {
        const self = this;
        if (self.roles.find(r => r.id === role.id && r.entity === role.entity)) {
            return true;
        }
        return false;
    }
    toggleRole(event: Event, role: any, service: any) {
        const self = this;
        const target: HTMLInputElement = <HTMLInputElement>event.target;
        if (target.checked) {
            self.roles.push({
                id: role.id,
                entity: role.entity,
                app: role.app,
                type: 'appcenter'
            });
        } else {
            const index = self.roles.findIndex(r => r.id === role.id && r.entity === role.entity);
            self.roles.splice(index, 1);
        }
        self.calculatePermission(service);
    }
    collapseAccordion() {
        const self = this;
        Object.keys(self.toggleAccordion).forEach(key => {
            self.toggleAccordion[key] = false;
        });
    }

    hasPermission(type: string) {
        const self = this;
        return self.commonService.hasPermission(type);
    }
}
