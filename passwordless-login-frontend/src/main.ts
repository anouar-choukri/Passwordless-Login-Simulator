import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
//import { provideHttpClient } from '@angular/common/http';
import { AppModule } from './app/app.module';
//import { AppComponent } from './app/app.component';


platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
