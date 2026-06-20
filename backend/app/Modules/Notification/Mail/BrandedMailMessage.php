<?php

namespace App\Modules\Notification\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BrandedMailMessage extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{primary: string, accent: string, background: string, surface: string, muted: string, text: string}  $emailTheme
     */
    public function __construct(
        public readonly string $mailSubject,
        public readonly string $innerHtml,
        public readonly string $previewText = '',
        public readonly array $emailTheme = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        $theme = $this->emailTheme !== [] ? $this->emailTheme : \App\Modules\Notification\Support\EmailTheme::system();

        return new Content(
            view: 'emails.branded',
            with: [
                'innerHtml' => $this->innerHtml,
                'previewText' => $this->previewText,
                'appName' => config('lms.app_name'),
                'theme' => $theme,
            ],
        );
    }
}
