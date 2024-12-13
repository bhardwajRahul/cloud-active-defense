import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Decoy } from '../../models/decoy';
import { DecoyService } from '../../services/decoy.service';
import { ToastrService } from 'ngx-toastr';
import { DecoyData, DecoyState } from '../../models/decoy-data';
import { FormsModule } from '@angular/forms';
import { GlobalStateService } from '../../services/global-state.service';
import { isProtectedAppEmpty } from '../../models/protected-app';
import { RouterLink } from '@angular/router';
import { UUID } from '../../models/types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-decoy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-decoy.component.html',
  styleUrl: './list-decoy.component.scss'
})
export class ListDecoyComponent implements OnInit, OnDestroy {
  decoys: DecoyData[] = [];
  globalStateSubscription?: Subscription;

  constructor(private decoyService: DecoyService, private toastr: ToastrService, private globalState: GlobalStateService) { }

  async ngOnInit() {
    this.globalStateSubscription = this.globalState.selectedApp$.subscribe(data => {
      if (isProtectedAppEmpty(data)) return;
      this.getDecoyList();
    });
  }

  ngOnDestroy(): void {
    this.globalStateSubscription?.unsubscribe();
    this.save();
  }

  async getDecoyList() {
    const decoysResponse = await this.decoyService.getDecoys();
    if (decoysResponse.type == 'error') this.toastr.error(decoysResponse.message, "Error");
    this.decoys = decoysResponse.data as DecoyData[] || [];
  }

  displayDecoy(decoy: Decoy): string {
    let key = decoy.decoy.dynamicKey || decoy.decoy.key || '';
    let value = decoy.decoy.dynamicValue || decoy.decoy.value || '';
    return `${key}${value ? decoy.decoy.separator ? decoy.decoy.separator : '=' : ''}${value}`;
  }

  isDeployed(state: DecoyState) {
    if (state == 'active') return true;
    else return false;
  }
  setDeployed(decoyData: DecoyData) {
    if (decoyData.state == 'active') decoyData.state = 'inactive';
    else decoyData.state = 'active';
  }
  async deleteDecoy(decoyId: UUID) {
    const saveResponse = await this.decoyService.deleteDecoy(decoyId);
    if (saveResponse.type == 'error') this.toastr.error(saveResponse.message, "Error saving");
    else {
      this.toastr.success("Successfully deleted decoy", "Deleted");
      this.getDecoyList();
    }
  }

  async save() {
    if (!this.decoys.length) return;
    const saveResponse = await this.decoyService.updateDecoysState(this.decoys);
    if (saveResponse.type == 'error') this.toastr.error(saveResponse.message, "Error saving");
    else this.toastr.success("Successfully saved decoys states", "Saved");
  }
}
