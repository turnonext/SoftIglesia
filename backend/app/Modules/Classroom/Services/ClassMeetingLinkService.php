<?php



namespace App\Modules\Classroom\Services;



use App\Modules\Classroom\Models\ClassMeetLink;

use App\Modules\Classroom\Models\ClassSession;

use App\Modules\Integrations\Services\MeetingProviderResolver;



class ClassMeetingLinkService

{

    public function __construct(

        private readonly MeetingProviderResolver $meetingProviders,

    ) {}



    /**

     * @return array{join_url: string, meeting_id: string|null, provider: string, is_dynamic: bool}

     */

    public function resolve(ClassSession $session): array

    {

        $existing = ClassMeetLink::query()->where('class_id', $session->id)->first();



        if ($existing) {

            return [

                'join_url' => $existing->join_url,

                'meeting_id' => $existing->meeting_id,

                'provider' => $session->provider ?? 'zoom',

                'is_dynamic' => ($existing->provider_meta['mode'] ?? '') !== 'fallback',

            ];

        }



        $built = $this->meetingProviders->createForSession($session);



        $link = ClassMeetLink::query()->create([

            'class_id' => $session->id,

            'meeting_id' => $built['meeting_id'],

            'join_url' => $built['join_url'],

            'start_url' => $built['start_url'] ?? null,

            'password' => $built['password'] ?? null,

            'provider_meta' => $built['provider_meta'],

        ]);



        $isDynamic = ($built['provider_meta']['mode'] ?? 'fallback') !== 'fallback';



        return [

            'join_url' => $link->join_url,

            'meeting_id' => $link->meeting_id,

            'provider' => $session->provider ?? 'zoom',

            'is_dynamic' => $isDynamic,

        ];

    }

}

