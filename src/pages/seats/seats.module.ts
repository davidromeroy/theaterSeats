import { NgModule } from '@angular/core';
import { AlertController, IonicPageModule } from 'ionic-angular';
import { SeatsPage } from './seats';

@NgModule({
  declarations: [
    SeatsPage,
  ],
  imports: [
    IonicPageModule.forChild(SeatsPage),
  ],
})
export class SeatsPageModule {}
