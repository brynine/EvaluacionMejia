import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface TvShow {
  id: number;
  name: string;
  premiered: string | null;
  rating: { average: number | null } | null;
  image?: { medium: string; original: string };
}

interface TvMazeResult {
  show: TvShow;
}

interface WatchItem {
  serie_id: number;
  titulo_formateado: string;
  es_top: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  searchTerm = 'a';
  resultados: TvMazeResult[] = [];
  cargando = false;
  error = '';
  watchlist: WatchItem[] = [];
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.cargarWatchlist();
    }
    this.buscar();
  }

  buscar(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      return;
    }

    this.cargando = true;
    this.error = '';
    const letra = this.searchTerm.trim();

    this.http.get<TvMazeResult[]>(`https://api.tvmaze.com/search/shows?q=${letra}`)
      .subscribe({
        next: (data) => {
          this.resultados = data || [];
          this.cargando = false;
        },
        error: () => {
          this.error = 'Error al cargar las series';
          this.cargando = false;
        }
      });
  }

  obtenerClaseRating(show: TvShow): string {
    const promedio =
      show.rating && show.rating.average !== null
        ? show.rating.average
        : null;

    if (promedio !== null && promedio >= 8) {
      return 'card card-top';
    }

    return 'card card-normal';
  }

  textoRating(show: TvShow): string {
    if (show.rating && show.rating.average !== null) {
      return show.rating.average.toString();
    }
    return 'Sin calificar';
  }

  cargarWatchlist(): void {
    if (!this.isBrowser) return;

    const data = localStorage.getItem('mi_watchlist');

    if (data) {
      try {
        this.watchlist = JSON.parse(data) as WatchItem[];
      } catch {
        this.watchlist = [];
      }
    } else {
      this.watchlist = [];
    }
  }

  guardarWatchlist(): void {
    if (!this.isBrowser) return;

    localStorage.setItem('mi_watchlist', JSON.stringify(this.watchlist));
  }

  estaEnWatchlist(serieId: number): boolean {
    return this.watchlist.some((item) => item.serie_id === serieId);
  }

  construirTituloFormateado(show: TvShow): string {
    let year = 'N/A';

    if (show.premiered && show.premiered.length >= 4) {
      year = show.premiered.substring(0, 4);
    }

    return `${show.name} (${year})`;
  }

  esTop(show: TvShow): boolean {
    const promedio =
      show.rating && show.rating.average !== null
        ? show.rating.average
        : null;

    return promedio !== null && promedio >= 8;
  }

  toggleWatch(show: TvShow): void {
    if (!this.isBrowser) return;

    const existe = this.estaEnWatchlist(show.id);

    if (existe) {
      this.watchlist = this.watchlist.filter(
        (item) => item.serie_id !== show.id
      );
      this.guardarWatchlist();
      return;
    }

    const item: WatchItem = {
      serie_id: show.id,
      titulo_formateado: this.construirTituloFormateado(show),
      es_top: this.esTop(show),
    };

    this.watchlist.push(item);
    this.guardarWatchlist();
  }

  textoBotonWatch(show: TvShow): string {
    return this.estaEnWatchlist(show.id)
      ? 'Dejar de seguir'
      : 'Seguir';
  }

  claseBotonWatch(show: TvShow): string {
    return this.estaEnWatchlist(show.id)
      ? 'btn-watch btn-watch-active'
      : 'btn-watch';
  }
}
