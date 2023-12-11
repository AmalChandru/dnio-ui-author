import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';

@Injectable()
export class EntityGuard  {

  constructor(private router: Router, private commonService: CommonService) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.commonService.hasPermissionStartsWith('PMDS')
      || this.commonService.hasPermissionStartsWith('PVDS')) {
      return true;
    } else {
      this.router.navigate(['/app', this.commonService.app._id, 'lib']);
      return false;
    }
  }
}
